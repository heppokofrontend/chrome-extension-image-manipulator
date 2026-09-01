import { renderCanvas } from '@/contexts/content-scripts/components/canvas';
import { renderImageController } from '@/contexts/content-scripts/components/image-controller';
import { renderImageInfo } from '@/contexts/content-scripts/components/image-info';
import { applyImageList } from '@/contexts/content-scripts/components/image-list';
import { STATE } from '@/contexts/content-scripts/state';
import { CONTENT_UI } from '@/contexts/content-scripts/ui';
import {
  getImageData,
  resolveDialogImage,
  applyZoomAndScroll,
} from '@/contexts/content-scripts/utils';

const { dialog, imageList } = CONTENT_UI;

export const showDialog = async (option?: { useCache?: boolean }) => {
  const useCache = option?.useCache ?? false;

  if (!dialog.open) {
    dialog.showModal();
  }

  if (!STATE.currentImageElement) {
    return;
  }

  const originalImageData = getImageData(STATE.currentImageElement);
  const resolved = await resolveDialogImage(STATE.currentImageElement, originalImageData);

  if (!resolved) {
    return;
  }

  renderCanvas();
  applyImageList(useCache);

  if (dialog.open) {
    imageList.querySelector<HTMLButtonElement>('[aria-current="true"]')?.focus();
  } else {
    dialog.showModal();
  }

  applyZoomAndScroll({
    targetImage: STATE.currentImageElement,
    scaleValue: resolved.initialScale ?? 'init',
  });

  // resolveDialogImage/applyZoomAndScroll を経て STATE.currentImageElement は
  // ダイアログ用クローンに切り替わっているため、そのクローンの最新データで描画する。
  const clonedImageData = getImageData(STATE.currentImageElement);

  renderImageInfo(clonedImageData);
  renderImageController(clonedImageData);
};
