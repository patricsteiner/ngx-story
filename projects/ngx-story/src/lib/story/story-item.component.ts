import { Observable } from 'rxjs';
import { StoryItemData } from './models';
import { Signal } from '@angular/core';

export interface StoryItemComponent {
  data: Signal<StoryItemData>;
  progress$: Observable<number>;
  loading$: Observable<boolean>;
  error$: Observable<boolean>;
  muted$: Observable<boolean>;
  finished$: Observable<boolean>;
  load(): void;
  play(): void;
  pause(): void;
  mute(muted: boolean): void;
  resetProgress(): void;
}
