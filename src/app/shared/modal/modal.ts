import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.html',
  styleUrl: './modal.scss'
})
export class Modal {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() confirmText = 'OK';
  @Input() cancelText = 'Cancel';
  @Input() showCancel = true;
  @Input() showConfirm = true;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() overlayClick = new EventEmitter<void>();

  onOverlayClick() {
    this.overlayClick.emit();
  }

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
