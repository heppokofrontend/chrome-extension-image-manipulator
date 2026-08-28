import { createImageList } from '@/contexts/content-scripts/components/image-list-section';
import { getImageListSectionFields } from '@/contexts/content-scripts/components/image-list-section/renderers';
import { STATE } from '@/contexts/content-scripts/state';
import { CONTENT_UI } from '@/contexts/content-scripts/ui';
import {
  getFileSize,
  getImageData,
  setImageData,
  setInputValues,
  zoomAndScrollInit,
} from '@/contexts/content-scripts/utils';

const { dialog, spaceElement } = CONTENT_UI;

export const showDialog = async (option?: { noCreateImageList?: boolean }) => {
  const noCreateImageList = option?.noCreateImageList ?? false;

  if (!dialog.open) {
    dialog.showModal();
  }

  const showImageInDialog = async (resolve: () => void) => {
    if (!STATE.currentImageElement) {
      return;
    }

    const imageData = getImageData(STATE.currentImageElement);
    const initialScale = (() => {
      if (!('clonedImage' in imageData) || !(imageData.clonedImage instanceof HTMLImageElement)) {
        return null;
      }

      return getImageData(imageData.clonedImage).scale;
    })();

    if (!imageData.isInDialog) {
      if (imageData.clonedImage === null) {
        dialog.setAttribute('aria-busy', 'true');
        spaceElement.classList.add('loading');

        const clonedImage = new Image();

        clonedImage.alt = STATE.currentImageElement.alt;
        clonedImage.src = STATE.currentImageElement.src;
        clonedImage.width = STATE.currentImageElement.width;
        clonedImage.height = STATE.currentImageElement.height;

        const isError = await new Promise<boolean>((done) => {
          clonedImage.onload = () => done(false);
          clonedImage.onerror = () => done(true);
        });

        if (isError) {
          console.log('Chrome Extension Image Manipulator: 404 ERROR', STATE.currentImageElement);
          dialog.removeAttribute('aria-busy');
          spaceElement.classList.remove('loading');
          return;
        }

        // ダイアログ用の画像は別で管理する
        setImageData(clonedImage, {
          ...imageData,
          isInDialog: true,
          origin: STATE.currentImageElement,
        });

        setImageData(STATE.currentImageElement, {
          clonedImage,
        });

        STATE.currentImageElement = clonedImage;

        // 容量の解決
        await getFileSize(clonedImage).finally(() => {
          dialog.removeAttribute('aria-busy');
          spaceElement.classList.remove('loading');
          zoomAndScrollInit(clonedImage, imageData.scale);
        });
      } else {
        STATE.currentImageElement = imageData.clonedImage;
        resolve();
      }
    }

    spaceElement.textContent = '';
    spaceElement.append(STATE.currentImageElement);

    createImageList(noCreateImageList);

    if (dialog.open) {
      getImageListSectionFields()
        .imageList.querySelector<HTMLButtonElement>('[aria-current="true"]')
        ?.focus();
    } else {
      dialog.showModal();
    }

    zoomAndScrollInit(STATE.currentImageElement, initialScale || 'init');
    setInputValues(imageData);
    resolve();
  };

  return await new Promise<void>((resolve) => {
    void showImageInDialog(resolve);
  });
};
