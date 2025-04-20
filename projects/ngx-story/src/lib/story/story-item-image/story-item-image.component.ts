import { ChangeDetectionStrategy, Component, OnDestroy, signal, input } from '@angular/core';
import { StoryItemComponent } from '../story-item.component';
import { BehaviorSubject, interval, Subject, takeUntil } from 'rxjs';

@Component({
  templateUrl: './story-item-image.component.html',
  styleUrls: ['./story-item-image.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoryItemImageComponent implements StoryItemComponent, OnDestroy {
  readonly data = input.required<{
    src: string;
    type: 'image/jpeg' | 'image/png';
  }>();

  progress$ = new BehaviorSubject(0);
  loading$ = new BehaviorSubject(false);
  error$ = new BehaviorSubject(false);
  muted$ = new BehaviorSubject(false);
  finished$ = new BehaviorSubject(false);

  renderImage = signal(false);

  private readonly durationMs = 3000;
  private elapsedMs = 0;
  private paused = true;
  private readonly pause$ = new Subject<void>();
  private readonly destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load() {
    this.renderImage.set(true);
  }

  pause() {
    this.pause$.next();
    this.paused = true;
  }

  play() {
    if (!this.paused) {
      return; // to avoid this running two times simultaneously
    }
    if (this.elapsedMs >= this.durationMs) {
      this.elapsedMs = 0; // if it's already finished, we restart it
    }
    this.paused = false;
    const intervalMs = 100;
    interval(intervalMs)
      .pipe(takeUntil(this.pause$), takeUntil(this.destroy$))
      .subscribe(() => {
        this.elapsedMs += intervalMs;
        this.progress$.next(this.elapsedMs / this.durationMs);
        if (this.elapsedMs >= this.durationMs) {
          this.finished$.next(true);
          this.pause();
        }
      });
  }

  resetProgress() {
    this.elapsedMs = 0;
    this.progress$.next(0);
    this.finished$.next(false);
  }

  mute() {
    // noop
  }
}
