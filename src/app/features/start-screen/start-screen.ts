import { Component, EventEmitter, Output } from '@angular/core';


@Component({
  selector: 'app-start-screen',
  standalone: true,
  imports: [],
  templateUrl: './start-screen.html',
  styleUrl: './start-screen.scss'
})
export class StartScreen {
  @Output() start = new EventEmitter<void>();

  onStart() {
    this.start.emit();
  }
}
