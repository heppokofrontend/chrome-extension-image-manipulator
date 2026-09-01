const imageDataMap: Map<HTMLImageElement, StyleData> = new Map();

export const defaultState: StyleData = {
  isInDialog: false,
  clonedImage: null,
  scale: 100,
  oldScale: 100,
  rotate: 0,
  isReversed: false,
  render: 'crisp-edges',
  fileSize: 'loading...',
  fileType: 'loading...',
};

export const getImageData = (key: HTMLImageElement) => {
  if (!imageDataMap.has(key)) {
    imageDataMap.set(key, { ...defaultState });
  }

  return { ...imageDataMap.get(key) } as StyleData;
};

export const setImageData = ({ image, options }: { image: HTMLImageElement; options: Options }) => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- 型上は non-null だが、呼び出し元が誤って null を渡した場合の防御
  if (!image) {
    return;
  }

  const baseImageData = getImageData(image);
  const oldScale = baseImageData.scale;
  const imageData = {
    ...baseImageData,
    ...options,
    oldScale,
  } as StyleData;

  imageDataMap.set(image, {
    ...imageData,
  });
};
