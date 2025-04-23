import { Directive, ElementRef, output } from '@angular/core';
import { fromEvent, merge, of, timer } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Directive({ selector: '[ngxLongPress]' })
export class LongPressDirective {
  readonly longPressStart = output<void>();

  readonly longPressEnd = output<void>();

  private isDown = false;

  private readonly threshold = 200;

  private readonly down = merge(
    fromEvent<MouseEvent>(this.elementRef.nativeElement, 'mousedown').pipe(filter((event) => event.button == 0)),
    fromEvent<TouchEvent>(this.elementRef.nativeElement, 'touchstart'),
  ).pipe(map(() => true));

  private readonly up = merge(
    fromEvent<MouseEvent>(this.elementRef.nativeElement, 'mouseup').pipe(filter((event) => event.button == 0)),
    fromEvent<TouchEvent>(this.elementRef.nativeElement, 'touchend'),
  ).pipe(map(() => false));

  constructor(private readonly elementRef: ElementRef) {
    merge(this.up, this.down)
      .pipe(
        switchMap((state) => (state ? timer(this.threshold).pipe(map(() => state)) : of(state))),
        takeUntilDestroyed(),
      )
      .subscribe((state) => {
        if (state) {
          this.isDown = true;
          this.longPressStart.emit();
        } else if (this.isDown) {
          this.longPressEnd.emit();
          this.isDown = false;
        }
      });
  }
}
