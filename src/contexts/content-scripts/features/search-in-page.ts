import { STATE } from '@/contexts/content-scripts/state';
import { CONTENT_UI } from '@/contexts/content-scripts/ui';
import {
  convertedImgToDummyMap,
  convertedImgToSVGMap,
  getImageData,
} from '@/contexts/content-scripts/utils';
import { getMessage } from '@/utils';

const { dialog } = CONTENT_UI;

export const searchInPage = () => {
  if (!STATE.currentImageElement) {
    return;
  }

  const data = getImageData(STATE.currentImageElement);

  if (!data.isInDialog) {
    return;
  }

  if (!data.origin) {
    return;
  }

  const origin = (() => {
    if (document.body.contains(data.origin)) {
      return data.origin;
    }

    if (data.origin instanceof HTMLImageElement) {
      return convertedImgToSVGMap.get(data.origin) ?? convertedImgToDummyMap.get(data.origin);
    }

    return undefined;
  })();

  if (!origin) {
    alert(getMessage('searched_image_error'));

    return;
  }

  const point = document.createElement('span');
  const style = document.createElement('style');
  const uniqueString = `heppokofrontent-chrome-extension-image-controler-blink-${Date.now().toString(
    36,
  )}`;

  style.textContent = `
        @keyframes ${uniqueString} {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.2;
          }
          100% {
            opacity: 1;
          }
        }

        .${uniqueString} {
          animation: ${uniqueString} 333ms ease-in-out 3;
        }
      `;

  point.tabIndex = 0;
  point.textContent = getMessage('searched_image_message');
  point.style.cssText =
    'all: unset; position: absolute; z-index: -1; width: 0; height: 0; overflow: hidden; display: block;';
  point.addEventListener('blur', () => {
    point.remove();
    style.remove();
  });

  document.head.append(style);
  origin.before(point);
  origin.addEventListener('animationend', () => {
    origin.classList.remove(uniqueString);
  });
  dialog.close();

  const rect = origin.getBoundingClientRect();
  const isVisible =
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth);

  if (isVisible) {
    point.focus({
      preventScroll: true,
    });
    origin.classList.add(uniqueString);
  } else {
    origin.scrollIntoView();
    window.addEventListener('scrollend', () => {
      point.focus({
        preventScroll: true,
      });
      origin.classList.add(uniqueString);
    });
  }
};
