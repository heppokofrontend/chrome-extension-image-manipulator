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

const loadImage = async () => {
  if (!STATE.currentImageElement) {
    return { isSuccess: false } as const;
  }

  const originalImageData = getImageData(STATE.currentImageElement);
  const resolved = await resolveDialogImage(STATE.currentImageElement, originalImageData);

  if (!resolved) {
    return { isSuccess: false } as const;
  }

  return { isSuccess: true, targetImage: STATE.currentImageElement, resolved };
};

const render = ({
  useCache,
  targetImage,
  initialScale,
}: {
  useCache: boolean;
  targetImage: HTMLImageElement;
  initialScale: number | null;
}) => {
  renderCanvas();
  applyImageList(useCache);

  // resolveDialogImage 待機中に Esc 等で閉じられている場合は開き直し、
  // 開いたままなら画像リストの現在項目へフォーカスを戻す。
  if (!dialog.open) {
    dialog.showModal();
  } else {
    imageList.querySelector<HTMLButtonElement>('[aria-current="true"]')?.focus();
  }

  applyZoomAndScroll({
    targetImage,
    scaleValue: initialScale || 'init',
  });

  const clonedImageData = getImageData(targetImage);

  renderImageInfo(clonedImageData);
  renderImageController(clonedImageData);
};

export const showDialog = async (option?: { useCache?: boolean }) => {
  const useCache = option?.useCache ?? false;

  // resolveDialogImage の解決を待つ間も見せられるよう、先にダイアログを開いておく。
  if (!dialog.open) {
    dialog.showModal();
  }

  const result = await loadImage();

  if (!result.isSuccess) {
    return;
  }

  const { targetImage, resolved } = result;

  render({
    useCache,
    targetImage,
    initialScale: resolved.initialScale,
  });
};
