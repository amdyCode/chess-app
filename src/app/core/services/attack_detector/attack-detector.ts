import { Injectable } from '@angular/core';
import { Piece } from '../../models/piece';
import { Board } from '../../models/board';
import { Position } from '../../models/position';
import { PieceType } from '../../enums/piece-type';
import { Color } from '../../enums/color';

@Injectable({ providedIn: 'root' })
export class AttackDetector {

    isSquareAttacked(board: Board, position: Position, defenderColor: Color): boolean {
        const attackerColor = defenderColor === Color.WHITE ? Color.BLACK : Color.WHITE;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.color === attackerColor) {
                    if (this.canPieceAttack(piece, board, position)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    canPieceAttack(piece: Piece, board: Board, target: Position, getMoves?: (piece: Piece, board: Board) => Position[]): boolean {
        switch (piece.type) {
            case PieceType.PAWN:
                return this.canPawnAttack(piece, target);
            case PieceType.KING:
                return this.canKingAttack(piece, target);
            case PieceType.ROOK:
            case PieceType.KNIGHT:
            case PieceType.BISHOP:
            case PieceType.QUEEN:
                if (getMoves) {
                    const moves = getMoves(piece, board);
                    return moves.some(m => m.row === target.row && m.col === target.col);
                }
                return false;
            default:
                return false;
        }
    }

    private canPawnAttack(piece: Piece, target: Position): boolean {
        const direction = piece.color === Color.WHITE ? -1 : 1;
        if (piece.position.row + direction === target.row) {
            return Math.abs(piece.position.col - target.col) === 1;
        }
        return false;
    }

    private canKingAttack(piece: Piece, target: Position): boolean {
        return Math.abs(piece.position.row - target.row) <= 1 &&
            Math.abs(piece.position.col - target.col) <= 1;
    }

    isKingInCheck(board: Board, color: Color, canPieceAttackFn: (piece: Piece, board: Board, target: Position) => boolean): boolean {
        const kingPos = this.findKingPosition(board, color);
        if (!kingPos) return false;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.color !== color) {
                    if (canPieceAttackFn(piece, board, kingPos)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    findKingPosition(board: Board, color: Color): Position | null {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.type === PieceType.KING && piece.color === color) {
                    return { row, col };
                }
            }
        }
        return null;
    }
}
