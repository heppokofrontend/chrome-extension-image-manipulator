import { CONTENT_UI } from '@/contexts/content-scripts/ui';
import { getImageData, type createSetImageData } from '@/contexts/content-scripts/utils/image-data';

export const createZoomAndScrollInit = ({
  setImageData,
}: {
  setImageData: ReturnType<typeof createSetImageData>;
}) => {
  return (targetImage: HTMLImageElement, scaleValue?: number | 'init' | 'fit') => {
    const { canvas } = CONTENT_UI;
    const scale = (() => {
      const baseScale = scaleValue ?? getImageData(targetImage).scale;

      if (typeof baseScale === 'string') {
        const fitHeight = (canvas.offsetHeight - 100) / targetImage.naturalHeight;
        const fitWidth = (canvas.offsetWidth - 100) / targetImage.naturalWidth;
        const result = Math.floor(Math.min(fitHeight, fitWidth) * 100);

        const isResizedRatioOverHalfAreaWhenInit =
          baseScale === 'init' &&
          100 <= result &&
          ((fitHeight <= fitWidth &&
            canvas.offsetHeight / 2 < targetImage.naturalHeight * result) ||
            (fitWidth <= fitHeight && canvas.offsetWidth / 2 < targetImage.naturalWidth * result));

        if (isResizedRatioOverHalfAreaWhenInit) {
          const fitHeight = (canvas.offsetHeight * 0.5) / targetImage.naturalHeight;
          const fitWidth = (canvas.offsetWidth * 0.5) / targetImage.naturalWidth;
          return Math.floor(Math.min(fitHeight, fitWidth) * 100);
        }

        return result;
      }

      return baseScale;
    })();

    setImageData(targetImage, {
      scale,
    });

    const { scrollWidth, offsetWidth, scrollHeight, offsetHeight } = canvas;

    canvas.scroll({
      top: (scrollHeight - offsetHeight) / 2,
      left: (scrollWidth - offsetWidth) / 2,
    });
  };
};
