type RenderingMode = 'crisp-edges' | 'pixelated' | 'smooth' | 'high-quality';
type StyleData =
  | {
      isInDialog: true;
      scale: number;
      oldScale: number;
      rotate: number;
      reverse: boolean;
      fileSize: string;
      render: RenderingMode;
    }
  | {
      isInDialog: false;
      clonedImage: HTMLImageElement | null;
      scale: number;
      oldScale: number;
      rotate: number;
      reverse: boolean;
      fileSize: string;
      render: RenderingMode;
    };
type Options = {
  isInDialog?: StyleData['isInDialog'];
  clonedImage?: HTMLImageElement | null;
  scale?: StyleData['scale'];
  oldScale?: StyleData['scale'];
  rotate?: StyleData['rotate'];
  reverse?: StyleData['reverse'];
  render?: StyleData['render'];
  fileSize?: StyleData['fileSize'];
};
