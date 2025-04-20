import { ChangeDetectionStrategy, Component, ElementRef, signal, ViewChild, input } from '@angular/core';
import { StoryItemComponent } from '../story-item.component';
import { BehaviorSubject } from 'rxjs';

@Component({
  templateUrl: './story-item-video.component.html',
  styleUrls: ['./story-item-video.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoryItemVideoComponent implements StoryItemComponent {
  readonly data = input.required<{
    src: string;
    type: 'video/mp4';
  }>();

  progress$ = new BehaviorSubject(0);
  loading$ = new BehaviorSubject(false);
  error$ = new BehaviorSubject(false);
  muted$ = new BehaviorSubject(false);
  finished$ = new BehaviorSubject(false);

  @ViewChild('videoElement', { static: false })
  videoElement!: ElementRef<HTMLVideoElement>;

  renderVideo = signal(false);

  load() {
    this.loading$.next(true);
    this.renderVideo.set(true);
  }

  onEnded() {
    this.finished$.next(true);
  }

  onTimeUpdate(time: number) {
    const progress = time / this.videoElement.nativeElement.duration;
    this.progress$.next(progress);
    // Some browsers don't properly listen to the volumeChange event, therefore we assure here to manually set the `muted$` value if it wasn't picked up by the listener.
    if (this.muted$.value !== this.videoElement.nativeElement.muted && this.hasAudio(this.videoElement.nativeElement)) {
      this.muted$.next(this.videoElement.nativeElement.muted);
    }
  }

  pause() {
    this.videoElement?.nativeElement?.pause();
  }

  play() {
    setTimeout(async () => {
      this.mute(false);
      try {
        await this.videoElement.nativeElement.play();
      } catch (e: any) {
        this.mute(true);
        try {
          await this.videoElement.nativeElement.play();
        } catch (e: any) {
          this.mute(false);
          this.error$.next(e);
        }
      }
    });
  }

  resetProgress() {
    // this is wrapped in a timeout because for some reason it takes a while to set attributes like currentTime and muted on a video nativeElement
    setTimeout(() => {
      this.finished$.next(false);
      if (this.videoElement?.nativeElement) {
        this.videoElement.nativeElement.currentTime = 0;
      }
    }, 10);
  }

  onVolumeChange(event: any) {
    if (this.hasAudio(event.target)) {
      this.muted$.next(event.target.muted);
    }
  }

  mute(muted = true) {
    if (this.videoElement) {
      this.videoElement.nativeElement.volume = 1;
      this.videoElement.nativeElement.muted = muted;
    }
  }

  private hasAudio(video: any) {
    return video.mozHasAudio || Boolean(video.webkitAudioDecodedByteCount) || Boolean(video.audioTracks && video.audioTracks.length);
  }
}
