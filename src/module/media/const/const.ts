interface LadderSetting {
  height: number;
  vBitrate: string;
  aBitrate: string;
  bufSize: string;
}

export const DEFAULT_LADDER: LadderSetting[] = [
  { height: 2160, vBitrate: '15M', aBitrate: '128k', bufSize: '30M' },
  { height: 1440, vBitrate: '10M', aBitrate: '128k', bufSize: '20M' },
  { height: 1080, vBitrate: '5M', aBitrate: '96k', bufSize: '10M' },
  { height: 720, vBitrate: '3M', aBitrate: '96k', bufSize: '3M' },
  { height: 480, vBitrate: '2M', aBitrate: '64k', bufSize: '2M' },
  { height: 360, vBitrate: '1M', aBitrate: '48k', bufSize: '1M' },
];
