import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  signal,
  ViewChild,
  ViewContainerRef,
  input,
} from '@angular/core';
import { StoryItemComponent } from './story-item.component';
import { StoryItemVideoComponent } from './story-item-video/story-item-video.component';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { filter } from 'rxjs/operators';
import { StoryItemImageComponent } from './story-item-image/story-item-image.component';
import { StoryItemData } from '../models';
import { LongPressDirective } from '../long-press.directive';

/**
 * This component dynamically generates and maintains a list of subcomponents (StoryItemComponents) corresponding to its datasource.
 * StoryItemComponents are added to the view as the user navigates forward (i.e. when `next()` is called).
 * It also accepts custom content (i.e. action buttons and a cta) as ng-content. Example:
 *
 *   <ngx-story [dataSource]="dataSource">
 *     <div actions>
 *       <button>like</button>
 *       <button>share</button>
 *     </div>
 *     <div cta>
 *       <button>apply now!</button>
 *     </div>
 *   </ngx-story>
 *
 *   It maintains an index (`idx`) that indicates which element is currently "on top" (i.e. increased z-index).
 *   it also maintains subscriptions to the current "on top" element to be aware of everything that happens in this element and react accordingly (i.e. display errors or go next).
 */
@Component({
  selector: 'ngx-story',
  templateUrl: './story.component.html',
  styleUrls: ['./story.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LongPressDirective],
})
export class StoryComponent implements OnInit, OnDestroy {
  readonly dataSource = input.required<StoryItemData[]>();

  @Output()
  readonly pageChanged = new EventEmitter<number>();

  @Output()
  readonly lastPageReached = new EventEmitter<void>();

  @Output()
  readonly finished = new EventEmitter<void>();

  idx = signal(0);
  paused = signal(false);
  currentItemProgress = signal(0);
  currentItemLoading = signal(false);
  currentItemError = signal(false);
  currentItemMuted = signal(false);
  showCta = signal(false);

  @ViewChild('storyItemsHost', { static: true, read: ViewContainerRef })
  private storyItemsHost!: ViewContainerRef;
  @ViewChild('overlay')
  private overlay!: ElementRef<HTMLDivElement>;

  private longPressEndedAt?: Date;
  private storyItemComponentRefs: ComponentRef<StoryItemComponent>[] = [];
  private currentItemSubs: Subscription[] = [];

  private readonly destroy$ = new Subject<void>();

  constructor(private readonly renderer: Renderer2) {}

  ngOnInit() {
    const dataSource = this.dataSource();
    if (!dataSource || !dataSource.length) {
      throw new Error('dataSource must not be empty');
    }
    dataSource.forEach((dataSourceItem, i) => {
      const componentClass = dataSourceItem.type === 'video/mp4' ? StoryItemVideoComponent : StoryItemImageComponent;
      const componentRef = this.storyItemsHost.createComponent<StoryItemComponent>(componentClass);
      componentRef.setInput('data', { src: dataSourceItem.src, type: dataSourceItem.type });
      if (i < 2) {
        // always (pre-)load the first two items
        componentRef.instance.load();
      }
      this.renderer.setStyle(componentRef.location.nativeElement, 'position', 'absolute');
      this.renderer.setStyle(componentRef.location.nativeElement, 'z-index', i === 0 ? 0 : -1);
      this.storyItemComponentRefs.push(componentRef);
    });
    this.subscribeToCurrentItem();
    this.play();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async next() {
    if (this.idx() >= this.storyItemComponentRefs.length - 1) {
      // TODO could display a re-run icon here
      this.finished.emit();
      return;
    }
    if (this.idx() + 1 === this.storyItemComponentRefs.length - 1) {
      this.showCta.set(true);
      this.lastPageReached.emit();
    }
    this.renderer.setStyle(this.getCompRef(this.idx()).location.nativeElement, 'z-index', '-1');
    this.idx.update((i) => i + 1);
    this.renderer.setStyle(this.getCompRef(this.idx()).location.nativeElement, 'z-index', '0');
    this.pageChanged.emit(this.idx());
    this.subscribeToCurrentItem();
    this.play();
    this.resetProgress(this.idx() - 1);
    this.getCompRef(this.idx() + 1)?.instance.load();
  }

  prev() {
    if (this.idx() < 1) {
      return;
    }
    this.renderer.setStyle(this.getCompRef(this.idx()).location.nativeElement, 'z-index', '-1');
    this.idx.update((i) => i - 1);
    this.renderer.setStyle(this.getCompRef(this.idx()).location.nativeElement, 'z-index', '0');
    this.pageChanged.emit(this.idx());
    this.subscribeToCurrentItem();
    this.play();
    this.resetProgress(this.idx() + 1);
  }

  pause() {
    const compRef = this.getCompRef(this.idx());
    if (!compRef) {
      return;
    }
    compRef.instance.pause();
    this.paused.set(true);
  }

  play() {
    const compRef = this.getCompRef(this.idx());
    if (!compRef) {
      return;
    }
    this.storyItemComponentRefs.forEach((it) => it.instance.pause());
    compRef.instance.play();
    this.paused.set(false);
  }

  onOverlayClick(event: MouseEvent) {
    // In firefox, click fires immediately after longPressEnd - we avoid this with this check, otherwise the story switches to the next page too early
    if (this.longPressEndedAt && new Date().getTime() - this.longPressEndedAt?.getTime() <= 10) {
      return;
    }
    if (event.offsetX > this.overlay.nativeElement.offsetWidth / 2) {
      this.next();
    } else {
      this.prev();
    }
  }

  onLongPressStart() {
    this.pause();
  }

  onLongPressEnd() {
    this.longPressEndedAt = new Date();
    this.play();
  }

  onPlayButtonClick(event: MouseEvent) {
    event.stopPropagation();
    this.play();
  }

  private subscribeToCurrentItem() {
    this.currentItemSubs.forEach((it) => it.unsubscribe());
    const compRef = this.getCompRef(this.idx());
    this.currentItemSubs = [
      compRef.instance.finished$.pipe(takeUntil(this.destroy$), filter(Boolean)).subscribe(() => this.next()),
      compRef.instance.error$.pipe(takeUntil(this.destroy$)).subscribe((error) => {
        this.currentItemError.set(error);
      }),
      compRef.instance.muted$.pipe(takeUntil(this.destroy$)).subscribe((muted) => {
        this.currentItemMuted.set(muted);
      }),
      compRef.instance.progress$.pipe(takeUntil(this.destroy$)).subscribe((progress) => {
        this.currentItemProgress.set(progress);
      }),
      compRef.instance.loading$.pipe(takeUntil(this.destroy$)).subscribe((loading) => {
        this.currentItemLoading.set(loading);
      }),
    ];
  }

  private getCompRef(idx: number) {
    return this.storyItemComponentRefs[idx];
  }

  /**
   * Setting props such as currentTime and muted take some time for some reason (at least on firefox)...
   * That means to get a smooth experience, we should do these actions _after_ the next video is already playing (otherwise there will be a delay).
   */
  private resetProgress(currentIdx: number) {
    const compRef = this.getCompRef(currentIdx);
    if (!compRef) {
      return;
    }
    compRef.instance.resetProgress();
  }

  onUnmuteButtonClick(event: MouseEvent) {
    event.stopPropagation();
    const compRef = this.getCompRef(this.idx());
    if (!compRef) {
      return;
    }
    compRef.instance.mute(false);
  }
}
