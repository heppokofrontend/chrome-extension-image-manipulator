import { CONTENT_UI } from '@/contexts/content-scripts/ui';
import { applyImageStyle } from '@/contexts/content-scripts/utils/effects';
import { getImageData, setImageData } from '@/contexts/content-scripts/utils/image-data';

type ScaleValue = number | 'init' | 'fit';

const resolveScale = ({
  naturalWidth,
  naturalHeight,
  scaleValue,
}: {
  naturalWidth: number;
  naturalHeight: number;
  scaleValue: ScaleValue;
}) => {
  const { canvas } = CONTENT_UI;

  if (typeof scaleValue === 'number') {
    return scaleValue;
  }

  const fitHeight = (canvas.offsetHeight - 100) / naturalHeight;
  const fitWidth = (canvas.offsetWidth - 100) / naturalWidth;
  const fitScale = Math.floor(Math.min(fitHeight, fitWidth) * 100);

  // 'init' 時、フィット表示がキャンバスの半分を超える大きさになるなら、
  // 一覧性を確保するためさらに半分のサイズへ縮小する。
  const isHalfCanvasExceededOnInitialFit =
    scaleValue === 'init' &&
    100 <= fitScale &&
    ((fitHeight <= fitWidth && canvas.offsetHeight / 2 < naturalHeight * fitScale) ||
      (fitWidth <= fitHeight && canvas.offsetWidth / 2 < naturalWidth * fitScale));

  if (!isHalfCanvasExceededOnInitialFit) {
    return fitScale;
  }

  const halfAreaFitHeight = (canvas.offsetHeight * 0.5) / naturalHeight;
  const halfAreaFitWidth = (canvas.offsetWidth * 0.5) / naturalWidth;

  return Math.floor(Math.min(halfAreaFitHeight, halfAreaFitWidth) * 100);
};

interface Params {
  targetImage: HTMLImageElement;
  scaleValue?: ScaleValue;
}

export const applyZoomAndScroll = ({ targetImage, scaleValue }: Params) => {
  const { canvas } = CONTENT_UI;

  setImageData({
    image: targetImage,
    options: {
      scale: resolveScale({
        naturalWidth: targetImage.naturalWidth,
        naturalHeight: targetImage.naturalHeight,
        scaleValue: scaleValue ?? getImageData(targetImage).scale,
      }),
    },
  });
  applyImageStyle(targetImage);

  const { scrollWidth, offsetWidth, scrollHeight, offsetHeight } = canvas;

  canvas.scroll({
    top: (scrollHeight - offsetHeight) / 2,
    left: (scrollWidth - offsetWidth) / 2,
  });
};
