import { Component, inject, signal, effect, HostListener } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { GameEngine } from './core/services/game_engine/game-engine';
import { Board } from './features/board/board';
import { Sidebar } from './shared/sidebar/sidebar';
import { StartScreen } from './features/start-screen/start-screen';
import { Timer } from './features/timer/timer';
import { Modal } from './shared/modal/modal';
import { GameStatus } from './core/enums/game-status';
import { PieceType } from './core/enums/piece-type';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    Board,
    Sidebar,
    StartScreen,
    Timer,
    Modal
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private gameEngine = inject(GameEngine);
  gameState$ = this.gameEngine.gameState$;
  gameState = toSignal(this.gameState$);

  constructor() {
    effect(() => {
      const state = this.gameState();
      if (state) {
        this.checkGameOver(state.status);
      }
    });
  }
  showNewGameModal = signal(false);
  showGameOverModal = signal(false);
  gameOverMessage = signal('');
  gameStarted = false;
  private isDismissingModal = false;
  PieceType = PieceType;

  get isPromotionPending() {
    return !!this.gameState()?.promotionPending;
  }

  promotePawn(pieceType: string) {
    this.gameEngine.promotePawn(pieceType as PieceType);
  }

  cancelPromotion() {
    this.gameEngine.cancelPromotion();
  }

  @HostListener('document:click')
  onDocumentClick() {
    if (this.isDismissingModal) return;

    const state = this.gameState();
    if (state && !this.showGameOverModal() && !this.showNewGameModal() && this.gameStarted) {
      const status = state.status;
      if (status === GameStatus.CHECKMATE || status === GameStatus.STALEMATE ||
        status === GameStatus.DRAW || status === GameStatus.TIMEOUT) {
        this.showGameOverModal.set(true);
      }
    }
  }

  dismissGameOverModal() {
    this.isDismissingModal = true;
    this.showGameOverModal.set(false);
    setTimeout(() => {
      this.isDismissingModal = false;
    }, 100);
  }

  checkGameOver(status: GameStatus) {
    if (status === GameStatus.CHECKMATE || status === GameStatus.STALEMATE ||
      status === GameStatus.DRAW || status === GameStatus.TIMEOUT) {
      let message = '';
      switch (status) {
        case GameStatus.CHECKMATE:
          message = 'Echec et Mat! Game Over.';
          break;
        case GameStatus.STALEMATE:
          message = 'Egalite! Game is a draw.';
          break;
        case GameStatus.DRAW:
          message = 'Egalite! Game Over.';
          break;
        case GameStatus.TIMEOUT:
          message = 'Temps Ecoule! Game Over.';
          break;
      }
      this.gameOverMessage.set(message);
      this.showGameOverModal.set(true);
    }
  }

  startGame() {
    this.gameStarted = true;
  }

  onNewGameRequest() {
    this.showNewGameModal.set(true);
  }

  startNewGame() {
    this.gameEngine.resetGame();
    this.gameStarted = false;
    this.showNewGameModal.set(false);
  }

  cancelNewGame() {
    this.showNewGameModal.set(false);
  }

  onUndo() {
    this.gameEngine.undoMove();
  }

  onTimerTimeout(player: string) {
    this.gameEngine.setGameTimeout();
  }

  startNewGameFromGameOver() {
    this.showGameOverModal.set(false);
    this.gameStarted = false;
    this.gameEngine.resetGame();
  }
}
