/** Shape of the capture manifest, shared by the capture and the review driver. */

export type Viewport = { readonly name: string; readonly width: number; readonly height: number };

export type Landmark = {
  readonly tag: string;
  readonly label: string;
  readonly className: string;
  /** Document coordinates in CSS pixels. */
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly fontSize: number;
  readonly fontWeight: string;
  readonly fullyAboveFold: boolean;
};

export type PageMetrics = {
  readonly documentHeight: number;
  readonly scrollWidth: number;
  readonly innerWidth: number;
  readonly horizontalOverflow: boolean;
  readonly landmarks: readonly Landmark[];
  /** The page's rendered text (`document.body.innerText`), collapsed to single spaces. */
  readonly renderedText: string;
};

export type CaptureImage = { readonly file: string; readonly band: string };

export type CaptureRecord = {
  readonly scene: string;
  readonly title: string;
  readonly path: string;
  readonly intent: string;
  readonly viewport: Viewport;
  readonly deviceScaleFactor: number;
  readonly imageWidth: number;
  readonly images: readonly CaptureImage[];
} & PageMetrics;

export type Manifest = {
  readonly capturedAt: string;
  readonly baseUrl: string;
  readonly note: string;
  readonly captures: readonly CaptureRecord[];
};
