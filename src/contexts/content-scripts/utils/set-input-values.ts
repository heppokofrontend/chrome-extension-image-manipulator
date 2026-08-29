import { renderImageController } from '@/contexts/content-scripts/components/image-controller';
import { renderImageInfo } from '@/contexts/content-scripts/components/image-info';
import { STATE } from '@/contexts/content-scripts/state';

export const setInputValues = (imageData: StyleData) => {
  if (!imageData.isInDialog || !STATE.currentImageElement) {
    return;
  }

  // alt 以外のアクセシブルネームをサポートするかどうか
  renderImageInfo(imageData);
  renderImageController(imageData);
};
