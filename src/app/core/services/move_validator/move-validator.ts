import { inject, Injectable } from '@angular/core';
import { Piece } from '../../models/piece';
import { Board } from '../../models/board';
import { Position } from '../../models/position';
import { GameState } from '../../models/game-state';
import { AttackDetector } from '../attack_detector/attack-detector';
import { MoveGenerator } from '../move_generator/move-generator';

@Injectable({ providedIn: 'root' })
export class MoveValidator {
  private attackDetector = inject(AttackDetector);
  private moveGenerator = inject(MoveGenerator);

  getValidMoves(piece: Piece, state: GameState): Position[] {
    const board = state.board;
    const candidates = this.moveGenerator.getPieceMoves(piece, board, state);

    return candidates.filter(move => {
      const newBoard = this.simulateMove(board, piece, move);
      return !this.isKingInCheck(newBoard, piece.color);
    });
  }

  private simulateMove(board: Board, piece: Piece, to: Position): Board {
    const newBoard = board.map(row => [...row]);
    newBoard[piece.position.row][piece.position.col] = null;

    const capturedPiece = newBoard[to.row][to.col];

    if (piece.type === 'pawn' && !capturedPiece && piece.position.col !== to.col) {
      newBoard[piece.position.row][to.col] = null;
    }

    newBoard[to.row][to.col] = { ...piece, position: to };
    return newBoard;
  }

  isSquareAttacked(board: Board, position: Position, defenderColor: any): boolean {
    return this.attackDetector.isSquareAttacked(board, position, defenderColor);
  }

  isKingInCheck(board: Board, color: any): boolean {
    return this.attackDetector.isKingInCheck(board, color, (p, b, t) =>
      this.attackDetector.canPieceAttack(p, b, t, (p2, b2) => this.moveGenerator.getPieceMoves(p2, b2))
    );
  }

}