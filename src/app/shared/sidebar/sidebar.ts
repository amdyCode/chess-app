import { Component, EventEmitter, Input, Output } from '@angular/core';

import { GameState } from '../../core/models/game-state';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar {
  @Input() gameState: GameState | null = null;

  @Output() newGame = new EventEmitter<void>();
  @Output() undo = new EventEmitter<void>();

  isCollapsed = true;

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }
}
