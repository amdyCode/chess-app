import { inject, Injectable } from '@angular/core';
import { Piece } from '../../models/piece';
import { Board } from '../../models/board';
import { Position } from '../../models/position';
import { GameState } from '../../models/game-state';
import { PieceType } from '../../enums/piece-type';
import { Color } from '../../enums/color';
import { AttackDetector } from '../attack_detector/attack-detector';

@Injectable({ providedIn: 'root' })
export class MoveGenerator {
    private attackDetector = inject(AttackDetector);

    getPieceMoves(piece: Piece, board: Board, state?: GameState): Position[] {
        switch (piece.type) {
            case PieceType.PAWN: return state ? this.getPawnMoves(piece, state) : [];
            case PieceType.ROOK: return this.getRookMoves(piece, board);
            case PieceType.KNIGHT: return this.getKnightMoves(piece, board);
            case PieceType.BISHOP: return this.getBishopMoves(piece, board);
            case PieceType.QUEEN: return this.getQueenMoves(piece, board);
            case PieceType.KING: return state ? this.getKingMoves(piece, state) : this.getBasicKingMoves(piece, board);
            default: return [];
        }
    }

    public getPawnMoves(piece: Piece, state: GameState): Position[] {
        const moves: Position[] = [];
        const board = state.board;
        const { row, col } = piece.position;
        const direction = piece.color === Color.WHITE ? -1 : 1;
        const startRow = piece.color === Color.WHITE ? 6 : 1;

        // Forward move
        const nextRow = row + direction;
        if (this.isValidPosition(nextRow, col) && !board[nextRow][col]) {
            moves.push({ row: nextRow, col });

            // Double move
            const doubleNextRow = row + 2 * direction;
            if (row === startRow && !board[doubleNextRow][col]) {
                moves.push({ row: doubleNextRow, col });
            }
        }

        // Diagonal captures
        [-1, 1].forEach(offset => {
            const targetRow = row + direction;
            const targetCol = col + offset;
            if (this.isValidPosition(targetRow, targetCol)) {
                const target = board[targetRow][targetCol];
                if (target && target.color !== piece.color) {
                    moves.push({ row: targetRow, col: targetCol });
                } else if (state.enPassantTarget && state.enPassantTarget.row === targetRow && state.enPassantTarget.col === targetCol) {
                    moves.push({ row: targetRow, col: targetCol });
                }
            }
        });

        return moves;
    }

    public getRookMoves(piece: Piece, board: Board): Position[] {
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        return this.getLinearMoves(piece, board, directions);
    }

    public getBishopMoves(piece: Piece, board: Board): Position[] {
        const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        return this.getLinearMoves(piece, board, directions);
    }

    public getQueenMoves(piece: Piece, board: Board): Position[] {
        return [...this.getRookMoves(piece, board), ...this.getBishopMoves(piece, board)];
    }

    public getKnightMoves(piece: Piece, board: Board): Position[] {
        const moves: Position[] = [];
        const offsets = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];

        offsets.forEach(([dRow, dCol]) => {
            const newRow = piece.position.row + dRow;
            const newCol = piece.position.col + dCol;

            if (this.isValidPosition(newRow, newCol)) {
                const target = board[newRow][newCol];
                if (!target || target.color !== piece.color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        });

        return moves;
    }

    public getKingMoves(piece: Piece, state: GameState): Position[] {
        const moves = this.getBasicKingMoves(piece, state.board);

        // Castling
        if (piece.color === Color.WHITE) {
            if (state.castlingRights.white.kingSide && this.canCastle(state, piece, true)) {
                moves.push({ row: 7, col: 6 });
            }
            if (state.castlingRights.white.queenSide && this.canCastle(state, piece, false)) {
                moves.push({ row: 7, col: 2 });
            }
        } else {
            if (state.castlingRights.black.kingSide && this.canCastle(state, piece, true)) {
                moves.push({ row: 0, col: 6 });
            }
            if (state.castlingRights.black.queenSide && this.canCastle(state, piece, false)) {
                moves.push({ row: 0, col: 2 });
            }
        }

        return moves;
    }

    private getBasicKingMoves(piece: Piece, board: Board): Position[] {
        const moves: Position[] = [];
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];

        directions.forEach(([dRow, dCol]) => {
            const newRow = piece.position.row + dRow;
            const newCol = piece.position.col + dCol;

            if (this.isValidPosition(newRow, newCol)) {
                const target = board[newRow][newCol];
                if (!target || target.color !== piece.color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        });

        return moves;
    }

    private canCastle(state: GameState, king: Piece, isKingSide: boolean): boolean {
        const row = king.position.row;
        const board = state.board;

        if (this.attackDetector.isKingInCheck(board, king.color, (p, b, t) => this.canPieceAttack(p, b, t))) return false;

        if (isKingSide) {
            if (board[row][5] || board[row][6]) return false;
            if (this.attackDetector.isSquareAttacked(board, { row, col: 5 }, king.color) ||
                this.attackDetector.isSquareAttacked(board, { row, col: 6 }, king.color)) return false;
        } else {
            if (board[row][1] || board[row][2] || board[row][3]) return false;
            if (this.attackDetector.isSquareAttacked(board, { row, col: 3 }, king.color) ||
                this.attackDetector.isSquareAttacked(board, { row, col: 2 }, king.color)) return false;
        }

        return true;
    }

    private canPieceAttack(piece: Piece, board: Board, target: Position): boolean {
        return this.attackDetector.canPieceAttack(piece, board, target, (p, b) => this.getPieceMoves(p, b));
    }

    private getLinearMoves(piece: Piece, board: Board, directions: number[][]): Position[] {
        const moves: Position[] = [];

        for (const [dRow, dCol] of directions) {
            this.addLinearMovesInDirection(piece, board, moves, dRow, dCol);
        }

        return moves;
    }

    private addLinearMovesInDirection(piece: Piece, board: Board, moves: Position[], dRow: number, dCol: number): void {
        let row = piece.position.row + dRow;
        let col = piece.position.col + dCol;

        while (this.isValidPosition(row, col)) {
            const targetSquare = board[row][col];

            if (!targetSquare) {
                moves.push({ row, col });
                row += dRow;
                col += dCol;
                continue;
            }

            if (targetSquare.color !== piece.color) {
                moves.push({ row, col });
            }
            break;
        }
    }

    public isValidPosition(row: number, col: number): boolean {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }
}
