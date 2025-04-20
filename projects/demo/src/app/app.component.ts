import { Component } from '@angular/core';
import { StoryComponent } from '../../../ngx-story/src/lib/story/story.component';
import { StoryItemData } from '../../../ngx-story/src/lib/models';

@Component({
  selector: 'app-root',
  imports: [StoryComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  dataSource: StoryItemData[] = [
    {
      type: 'video/mp4',
      src: 'https://www.sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
    },
    {
      type: 'image/jpeg',
      src: 'https://picsum.photos/200/350',
    },
    {
      type: 'image/jpeg',
      src: 'https://picsum.photos/200/200',
    },
    {
      type: 'image/jpeg',
      src: 'https://picsum.photos/200/300',
    },
  ];
}
