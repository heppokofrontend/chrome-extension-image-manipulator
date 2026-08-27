import { SELECTOR } from '@/contexts/content-scripts/constants';
import { CONTENT_UI } from '@/contexts/content-scripts/ui';
import { STATE } from '@/contexts/content-scripts/state';
import { convertDummyElementToImg, convertSVGToImg } from '@/contexts/content-scripts/utils';

const getElement = (target: EventTarget | null) => {
  if (target === null || (!(target instanceof HTMLElement) && !(target instanceof SVGElement))) {
    return null;
  }

  if (STATE.currentImageElement instanceof HTMLImageElement && target === CONTENT_UI.imageViewer) {
    return STATE.currentImageElement;
  }

  if (target instanceof HTMLImageElement || target instanceof SVGElement) {
    const svg = target.closest('svg');

    if (svg) {
      return svg;
    }

    return target;
  }

  const childrenImages = target.querySelectorAll('img, svg');

  if (childrenImages.length === 1) {
    return childrenImages[0];
  }

  const checkOtherTrees = (currentNode: typeof target) => {
    if (currentNode.matches(SELECTOR)) {
      return currentNode;
    }

    const imagesFromParent = currentNode?.querySelectorAll(SELECTOR);

    if (imagesFromParent?.length !== 0) {
      return imagesFromParent[0];
    }

    const focusableOrSemanticContextsImages = currentNode
      .closest('a, button, [tabindex], [aria-label], [role="button"], [role="link"]')
      ?.querySelectorAll(SELECTOR);

    if (focusableOrSemanticContextsImages?.length === 1) {
      return focusableOrSemanticContextsImages[0];
    }

    return undefined;
  };

  let currentNode: HTMLElement | null = target;
  const { documentElement } = document;
  let i = 0;

  // 全体から探す
  while (currentNode !== documentElement) {
    i++;

    if (i === 100) {
      return null;
    }
    currentNode = currentNode.parentElement;

    if (currentNode) {
      const result = checkOtherTrees(currentNode);

      if (result) {
        return result;
      }

      continue;
    }

    return null;
  }

  return target;
};

const resolveTarget = (target: EventTarget | null) => {
  const img = getElement(target);

  if (img instanceof HTMLImageElement) {
    return img;
  }
  if (img instanceof SVGElement) {
    return convertSVGToImg(img);
  }

  if (img instanceof HTMLElement) {
    return convertDummyElementToImg(img);
  }

  return null;
};

const dialogContains = (image: HTMLImageElement) => {
  return image ? CONTENT_UI.spaceElement.contains(image) : false;
};

export const onContextmenu = ({ target }: MouseEvent) => {
  const targetImage = resolveTarget(target);

  if (!(targetImage instanceof HTMLImageElement)) {
    STATE.currentImageElement = null;
    console.log('Chrome Extension Image Manipulator: No image');

    return;
  }

  if (targetImage) {
    const isInDialog = dialogContains(targetImage);

    if (!isInDialog) {
      if (typeof targetImage.dataset['imageManipulatorDefaultStyle'] !== 'string') {
        targetImage.dataset['imageManipulatorDefaultStyle'] =
          targetImage.getAttribute('style') || '';
      }

      STATE.currentImageElement = targetImage;
    }
  }
};
