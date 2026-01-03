import { Component, Input, OnDestroy, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-timer',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './timer.html',
    styleUrl: './timer.scss'
})
export class Timer implements OnInit, OnDestroy {
    @Input() initialTime: number = 600;
    @Input() active: boolean = false;
    @Input() reset: boolean = false;
    @Output() timeout = new EventEmitter<void>();

    timeRemaining: number = 600;
    private interval: any;
    private previousReset: boolean = false;

    ngOnInit() {
        this.timeRemaining = this.initialTime;
    }

    ngOnChanges() {
        if (this.reset && !this.previousReset) {
            this.previousReset = this.reset;
            this.timeRemaining = this.initialTime;
            this.stopTimer();
        } else if (!this.reset && this.previousReset) {
            this.previousReset = this.reset;
        }

        if (this.active) {
            this.startTimer();
        } else {
            this.stopTimer();
        }
    }

    ngOnDestroy() {
        this.stopTimer();
    }

    private startTimer() {
        if (this.interval) clearInterval(this.interval);
        this.interval = setInterval(() => {
            if (this.timeRemaining > 0) {
                this.timeRemaining--;
            } else {
                this.stopTimer();
                this.timeout.emit();
            }
        }, 1000);
    }

    private stopTimer() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    formatTime(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    isLowTime(): boolean {
        return this.timeRemaining < 60;
    }
}
