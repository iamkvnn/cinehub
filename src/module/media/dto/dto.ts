export class ImageDto {
  url: string;
  key: string;
}

export interface VideoResolution {
  width: number;
  height: number;
}

export class VideoDto extends ImageDto {}
