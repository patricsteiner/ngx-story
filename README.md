# ngx-story

Library for Instagram-style story viewing in your Angular applications. It supports both image and video content, with features like:

- Progress indicators for story duration
- Touch/click navigation between stories
- Pause on hold functionality
- Automatic progression through story items
- Mute/unmute controls for video content
- Responsive design that works across devices
- Customizable styling options
- Customizable action buttons

## Installation

```bash
npm install ngx-story
```

## Usage

```html
<ngx-story [dataSource]="dataSource" style="width: 400px; height: 700px">
  <div actions>
    <button>like</button>
    <button>share</button>
  </div>
  <div cta>
    <button>learn more!</button>
  </div>
</ngx-story>
```

```typescript
dataSource: StoryItemData[] = [
  {
    type: 'video/mp4',
    src: 'https://www.sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
  },
  {
    type: 'image/jpeg',
    src: 'https://picsum.photos/200/350',
  }
];
```

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```
