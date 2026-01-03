import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { GameState } from '../../core/models/game-state';
import { GameEngine } from '../../core/services/game_engine/game-engine';
import { PieceType } from '../../core/enums/piece-type';
import { Color } from '../../core/enums/color';
import { Piece } from '../../core/models/piece';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './board.html',
  styleUrl: './board.scss'
})
export class Board implements OnInit {
  private gameEngine = inject(GameEngine);
  gameState$!: Observable<GameState>;
  files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  ngOnInit(): void {
    this.gameState$ = this.gameEngine.gameState$;
  }

  onSquareClick(row: number, col: number): void {
    this.gameEngine.selectSquare({ row, col });
  }

  isLightSquare(row: number, col: number): boolean {
    return (row + col) % 2 === 0;
  }

  isSelected(row: number, col: number, state: GameState): boolean {
    return state.selectedPosition?.row === row && state.selectedPosition?.col === col;
  }

  isValidMove(row: number, col: number, state: GameState): boolean {
    return state.validMoves.some(m => m.row === row && m.col === col);
  }

  isLastMove(row: number, col: number, state: GameState): boolean {
    if (state.moveHistory.length === 0) return false;
    const lastMove = state.moveHistory[state.moveHistory.length - 1];
    return (lastMove.from.row === row && lastMove.from.col === col) ||
      (lastMove.to.row === row && lastMove.to.col === col);
  }

  isKingInCheck(row: number, col: number, state: GameState): boolean {
    const piece = state.board[row][col];
    if (!piece || piece.type !== PieceType.KING) return false;
    return state.status === 'check' && piece.color === state.currentPlayer;
  }

  getPieceIcon(piece: Piece | null): string {
    if (!piece) return '';

    const solidOrRegular = piece.color === Color.BLACK ? 'fa-solid' : 'fa-regular';
    const pieceMap: Record<PieceType, string> = {
      [PieceType.KING]: 'fa-chess-king',
      [PieceType.QUEEN]: 'fa-chess-queen',
      [PieceType.ROOK]: 'fa-chess-rook',
      [PieceType.BISHOP]: 'fa-chess-bishop',
      [PieceType.KNIGHT]: 'fa-chess-knight',
      [PieceType.PAWN]: 'fa-chess-pawn'
    };

    return `${solidOrRegular} ${pieceMap[piece.type]}`;
  }
}