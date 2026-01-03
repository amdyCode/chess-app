import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GameState } from '../../core/models/game-state';
import { GameEngine } from '../../core/services/game_engine/game-engine';
import { GameStatus } from '../../core/enums/game-status';
import { Color } from '../../core/enums/color';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-controls',
    imports: [CommonModule],
    templateUrl: './controls.html',
    styleUrl: './controls.scss',
    standalone: true
})
export class Controls implements OnInit {
    private gameEngine = inject(GameEngine);
    gameState$!: Observable<GameState>;
    Math = Math;
    @Output() newGameRequest = new EventEmitter<void>();

    ngOnInit(): void {
        this.gameState$ = this.gameEngine.gameState$;
    }

    onNewGame(): void {
        this.newGameRequest.emit();
    }

    onUndo(): void {
        this.gameEngine.undoMove();
    }

    getStatusText(state: GameState): string {
        switch (state.status) {
            case GameStatus.CHECK: return 'Check!';
            case GameStatus.CHECKMATE: return 'Checkmate!';
            case GameStatus.STALEMATE: return 'Stalemate';
            case GameStatus.DRAW: return 'Draw';
            default: return 'In Progress';
        }
    }

    getCurrentPlayerIcon(color: Color): string {
        return color === Color.WHITE ? 'fa-regular fa-chess-king' : 'fa-solid fa-chess-king';
    }

    getPieceIcon(piece: any, color: string): string {
        const solidOrRegular = color === 'black' ? 'fa-solid' : 'fa-regular';
        const pieceMap: Record<string, string> = {
            'king': 'fa-chess-king',
            'queen': 'fa-chess-queen',
            'rook': 'fa-chess-rook',
            'bishop': 'fa-chess-bishop',
            'knight': 'fa-chess-knight',
            'pawn': 'fa-chess-pawn'
        };
        return `${solidOrRegular} ${pieceMap[piece.type]}`;
    }

    formatTime(timestamp: Date): string {
        return new Date(timestamp).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
