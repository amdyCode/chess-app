import { Injectable } from '@angular/core';
import { PieceType } from '../../enums/piece-type';
import { Board } from '../../models/board';
import { Move } from '../../models/move';
import { Piece } from '../../models/piece';
import { Position } from '../../models/position';

@Injectable({ providedIn: 'root' })
export class MoveHandler {
    applyMove(board: Board, from: Position, to: Position, currentState: {
        castlingRights: any,
        enPassantTarget: Position | null,
        halfMoveClock: number,
        fullMoveNumber: number
    }): { newBoard: Board, move: Move, capturedPiece: Piece | null } {
        const newBoard = board.map(row => [...row]);
        const piece = newBoard[from.row][from.col];

        if (!piece) throw new Error('No piece at source position');

        let capturedPiece = newBoard[to.row][to.col];
        const isPawn = piece.type === PieceType.PAWN;
        const isKing = piece.type === PieceType.KING;
        let isEnPassant = false;
        let isCastling = false;

        // Handle En Passant Capture
        if (isPawn && !capturedPiece && from.col !== to.col) {
            capturedPiece = newBoard[from.row][to.col];
            newBoard[from.row][to.col] = null;
            isEnPassant = true;
        }

        // Handle Castling
        if (isKing && Math.abs(from.col - to.col) === 2) {
            this.handleCastling(newBoard, from, to);
            isCastling = true;
        }

        const move: Move = {
            from,
            to,
            piece: { ...piece },
            capturedPiece: capturedPiece ? { ...capturedPiece } : undefined,
            isEnPassant,
            isCastling,
            timestamp: new Date(),
            notation: this.generateNotation(piece, from, to, capturedPiece),
            prevCastlingRights: JSON.parse(JSON.stringify(currentState.castlingRights)),
            prevEnPassantTarget: currentState.enPassantTarget ? { ...currentState.enPassantTarget } : null,
            prevHalfMoveClock: currentState.halfMoveClock,
            prevFullMoveNumber: currentState.fullMoveNumber
        };

        // Execute Move
        newBoard[to.row][to.col] = { ...piece, position: to, hasMoved: true };
        newBoard[from.row][from.col] = null;

        if (isPawn && (to.row === 0 || to.row === 7)) {
            newBoard[to.row][to.col] = { ...newBoard[to.row][to.col]!, type: PieceType.QUEEN };
            move.isPromotion = true;
            move.promotionPiece = PieceType.QUEEN;
        }

        return { newBoard, move, capturedPiece };
    }


    private handleCastling(board: Board, from: Position, to: Position): void {
        const isKingSide = to.col > from.col;
        const rookFromCol = isKingSide ? 7 : 0;
        const rookToCol = isKingSide ? 5 : 3;
        const rookRow = from.row;

        const rook = board[rookRow][rookFromCol];
        if (rook) {
            board[rookRow][rookToCol] = {
                ...rook,
                position: { row: rookRow, col: rookToCol },
                hasMoved: true
            };
            board[rookRow][rookFromCol] = null;
        }
    }

    private generateNotation(piece: Piece, from: Position, to: Position, captured?: Piece | null): string {
        const files = 'abcdefgh';
        const pieceSymbol = piece.type === PieceType.PAWN ? '' : piece.type[0].toUpperCase();
        const captureSymbol = captured ? 'x' : '';
        const toSquare = `${files[to.col]}${8 - to.row}`;

        return `${pieceSymbol}${captureSymbol}${toSquare}`;
    }

    updateCastlingRights(currentRights: any, piece: Piece, from: Position, capturedPiece: Piece | null): any {
        const newRights = JSON.parse(JSON.stringify(currentRights));

        if (piece.type === PieceType.KING) {
            newRights[piece.color].kingSide = false;
            newRights[piece.color].queenSide = false;
        } else if (piece.type === PieceType.ROOK) {
            if (from.col === 0) newRights[piece.color].queenSide = false;
            if (from.col === 7) newRights[piece.color].kingSide = false;
        }

        if (capturedPiece && capturedPiece.type === PieceType.ROOK) {
            const { row, col } = capturedPiece.position;
            if (col === 0 && (row === 0 || row === 7)) {
                newRights[capturedPiece.color].queenSide = false;
            }
            if (col === 7 && (row === 0 || row === 7)) {
                newRights[capturedPiece.color].kingSide = false;
            }
        }

        return newRights;
    }
}
