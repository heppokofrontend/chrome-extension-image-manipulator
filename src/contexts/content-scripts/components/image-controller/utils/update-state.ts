import { STATE } from '@/contexts/content-scripts/state';
import { applyImageStyle, setImageData } from '@/contexts/content-scripts/utils';

export const updateState = (options: Options) => {
  if (STATE.currentImageElement) {
    setImageData({
      image: STATE.currentImageElement,
      options: {
        ...options,
      },
    });
    applyImageStyle(STATE.currentImageElement);
  }
};
