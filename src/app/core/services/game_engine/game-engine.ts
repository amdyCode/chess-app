import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { MoveValidator } from '../move_validator/move-validator';
import { GameState } from '../../models/game-state';
import { Color } from '../../enums/color';
import { GameStatus } from '../../enums/game-status';
import { Board } from '../../models/board';
import { PieceType } from '../../enums/piece-type';
import { Piece } from '../../models/piece';
import { Position } from '../../models/position';
import { MoveHandler } from '../move_handler/move-handler';

@Injectable({ providedIn: 'root' })
export class GameEngine {
  private gameStateSubject = new BehaviorSubject<GameState>(this.initializeGame());
  public gameState$: Observable<GameState> = this.gameStateSubject.asObservable();
  private moveValidator = inject(MoveValidator)
  private moveHandler = inject(MoveHandler);

  private initializeGame(): GameState {
    return {
      board: this.createInitialBoard(),
      currentPlayer: Color.WHITE,
      status: GameStatus.IN_PROGRESS,
      moveHistory: [],
      capturedPieces: { white: [], black: [] },
      selectedPosition: null,
      validMoves: [],
      halfMoveClock: 0,
      fullMoveNumber: 1,
      castlingRights: {
        white: { kingSide: true, queenSide: true },
        black: { kingSide: true, queenSide: true }
      },
      enPassantTarget: null
    };
  }

  selectSquare(position: Position): void {
    const state = this.gameStateSubject.value;
    const piece = state.board[position.row][position.col];

    if (state.selectedPosition) {
      this.handleSquareSelection(position, piece, state);
    } else if (piece && piece.color === state.currentPlayer) {
      this.selectPiece(position, piece, state);
    }
  }

  private handleSquareSelection(position: Position, piece: Piece | null, state: GameState): void {
    const isValidMove = state.validMoves.some(
      m => m.row === position.row && m.col === position.col
    );

    if (isValidMove) {
      this.makeMove(state.selectedPosition!, position);
    } else if (piece && piece.color === state.currentPlayer) {
      this.selectPiece(position, piece, state);
    } else {
      this.clearSelection();
    }
  }

  private createPiece(type: PieceType, color: Color, row: number, col: number): Piece {
    return {
      type,
      color,
      position: { row, col },
      hasMoved: false,
      id: `${color}-${type}-${row}-${col}-${Date.now()}`
    };
  }

  private createInitialBoard(): Board {
    const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

    // Pawns
    for (let col = 0; col < 8; col++) {
      board[1][col] = this.createPiece(PieceType.PAWN, Color.BLACK, 1, col);
      board[6][col] = this.createPiece(PieceType.PAWN, Color.WHITE, 6, col);
    }

    // Black pieces
    const backRow: PieceType[] = [
      PieceType.ROOK, PieceType.KNIGHT, PieceType.BISHOP, PieceType.QUEEN,
      PieceType.KING, PieceType.BISHOP, PieceType.KNIGHT, PieceType.ROOK
    ];

    backRow.forEach((type, col) => {
      board[0][col] = this.createPiece(type, Color.BLACK, 0, col);
      board[7][col] = this.createPiece(type, Color.WHITE, 7, col);
    });

    return board;
  }

  private selectPiece(position: Position, piece: Piece, state: GameState): void {
    const validMoves = this.moveValidator.getValidMoves(piece, state);
    this.gameStateSubject.next({ ...state, selectedPosition: position, validMoves });
  }

  private clearSelection(): void {
    const state = this.gameStateSubject.value;
    this.gameStateSubject.next({ ...state, selectedPosition: null, validMoves: [] });
  }

  private makeMove(from: Position, to: Position): void {
    const state = this.gameStateSubject.value;
    if (!state.board[from.row][from.col]) return;

    const { newBoard, move, capturedPiece } = this.moveHandler.applyMove(state.board, from, to, state);
    const piece = move.piece;

    const newCastlingRights = this.moveHandler.updateCastlingRights(state.castlingRights, piece, from, capturedPiece);
    const newEnPassantTarget = this.getEnPassantTarget(piece, from, to);
    const capturedPieces = this.updateCapturedPieces(state.capturedPieces, capturedPiece);

    const nextPlayer = state.currentPlayer === Color.WHITE ? Color.BLACK : Color.WHITE;
    const status = this.calculateGameStatus(newBoard, nextPlayer, newCastlingRights, newEnPassantTarget, state);

    this.gameStateSubject.next({
      ...state,
      board: newBoard,
      currentPlayer: nextPlayer,
      status,
      moveHistory: [...state.moveHistory, move],
      capturedPieces,
      selectedPosition: null,
      validMoves: [],
      halfMoveClock: (piece.type === PieceType.PAWN || capturedPiece) ? 0 : state.halfMoveClock + 1,
      fullMoveNumber: nextPlayer === Color.WHITE ? state.fullMoveNumber + 1 : state.fullMoveNumber,
      castlingRights: newCastlingRights,
      enPassantTarget: newEnPassantTarget
    });
  }

  private getEnPassantTarget(piece: Piece, from: Position, to: Position): Position | null {
    if (piece.type === PieceType.PAWN && Math.abs(from.row - to.row) === 2) {
      return { row: (from.row + to.row) / 2, col: from.col };
    }
    return null;
  }

  private updateCapturedPieces(capturedPieces: { white: Piece[], black: Piece[] }, capturedPiece: Piece | null) {
    if (!capturedPiece) return capturedPieces;
    const updated = { white: [...capturedPieces.white], black: [...capturedPieces.black] };
    if (capturedPiece.color === Color.WHITE) updated.white.push(capturedPiece);
    else updated.black.push(capturedPiece);
    return updated;
  }

  private calculateGameStatus(board: Board, nextPlayer: Color, castlingRights: any, enPassantTarget: Position | null, state: GameState): GameStatus {
    const isCheck = this.moveValidator.isKingInCheck(board, nextPlayer);

    const tempState: GameState = {
      ...state,
      board,
      currentPlayer: nextPlayer,
      castlingRights,
      enPassantTarget
    } as any;

    const hasValidMoves = this.hasAnyValidMoves(board, nextPlayer, tempState);

    if (!hasValidMoves) {
      return isCheck ? GameStatus.CHECKMATE : GameStatus.STALEMATE;
    }
    return isCheck ? GameStatus.CHECK : GameStatus.IN_PROGRESS;
  }

  private hasAnyValidMoves(board: Board, playerColor: Color, state: GameState): boolean {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.color === playerColor && this.moveValidator.getValidMoves(piece, state).length > 0) {
          return true;
        }
      }
    }
    return false;
  }

  resetGame(): void {
    this.gameStateSubject.next(this.initializeGame());
  }

  setGameTimeout(): void {
    const currentState = this.gameStateSubject.value;
    this.gameStateSubject.next({ ...currentState, status: GameStatus.TIMEOUT });
  }

  undoMove(): void {
    const state = this.gameStateSubject.value;
    if (state.moveHistory.length === 0) return;

    const newHistory = [...state.moveHistory];
    const lastMove = newHistory.pop()!;
    const newBoard = state.board.map(row => [...row]);

    newBoard[lastMove.from.row][lastMove.from.col] = { ...lastMove.piece, position: lastMove.from, hasMoved: lastMove.piece.hasMoved };
    newBoard[lastMove.to.row][lastMove.to.col] = null;

    if (lastMove.capturedPiece) {
      if (lastMove.isEnPassant) {
        newBoard[lastMove.from.row][lastMove.to.col] = { ...lastMove.capturedPiece };
      } else {
        newBoard[lastMove.to.row][lastMove.to.col] = { ...lastMove.capturedPiece };
      }
    }

    if (lastMove.isCastling) {
      const isKingSide = lastMove.to.col > lastMove.from.col;
      const rookFromCol = isKingSide ? 7 : 0;
      const rookToCol = isKingSide ? 5 : 3;
      const rookRow = lastMove.from.row;

      const rook = newBoard[rookRow][rookToCol];
      if (rook) {
        newBoard[rookRow][rookFromCol] = { ...rook, position: { row: rookRow, col: rookFromCol }, hasMoved: false };
        newBoard[rookRow][rookToCol] = null;
      }
    }

    const capturedPieces = this.removeFromCapturedPieces(state.capturedPieces, lastMove.capturedPiece);
    const prevPlayer = state.currentPlayer === Color.WHITE ? Color.BLACK : Color.WHITE;

    this.gameStateSubject.next({
      ...state,
      board: newBoard,
      currentPlayer: prevPlayer,
      status: GameStatus.IN_PROGRESS,
      moveHistory: newHistory,
      capturedPieces,
      selectedPosition: null,
      validMoves: [],
      castlingRights: lastMove.prevCastlingRights,
      enPassantTarget: lastMove.prevEnPassantTarget,
      halfMoveClock: lastMove.prevHalfMoveClock,
      fullMoveNumber: lastMove.prevFullMoveNumber
    });
  }

  private removeFromCapturedPieces(capturedPieces: { white: Piece[], black: Piece[] }, capturedPiece: Piece | undefined) {
    if (!capturedPiece) return capturedPieces;
    const updated = { white: [...capturedPieces.white], black: [...capturedPieces.black] };
    const list = capturedPiece.color === Color.WHITE ? updated.white : updated.black;
    const index = list.findIndex(p => p.id === capturedPiece.id);
    if (index !== -1) list.splice(index, 1);
    return updated;
  }

  getGameState(): GameState {
    return this.gameStateSubject.value;
  }
}