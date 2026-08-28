import {
  getImageControllerFields,
  renderImageController,
} from '@/contexts/content-scripts/components/image-controller';
import { renderImageInfo } from '@/contexts/content-scripts/components/image-info';
import {
  applyImageList,
  getImageListSectionFields,
  renderImageListSection,
} from '@/contexts/content-scripts/components/image-list-section';
import { STATE } from '@/contexts/content-scripts/state';
import { CONTENT_UI } from '@/contexts/content-scripts/ui';
import {
  convertedImgToDummyMap,
  convertedImgToSVGMap,
  zoomAndScrollInit,
  defaultState,
  getImageData,
  setImageData,
} from '@/contexts/content-scripts/utils';
import { buildDetails } from './build-details';

const { dialog } = CONTENT_UI;

export const renderDetails = () => {
  const { element, closeBtnForPortrait, closeBtn } = buildDetails();
  const closeHandler = () => {
    dialog.close();
  };

  closeBtnForPortrait.addEventListener('click', closeHandler);

  renderImageInfo(element);
  renderImageController(element);
  renderImageListSection(element);

  element.insertAdjacentHTML(
    'beforeend',
    `
      <div class="group">
        <p class="search-wrapper">
          <button id="search">
            🔍 ${chrome.i18n.getMessage('search_in_page')}
          </button>
        </p>
      </div>
    `,
  );

  closeBtn.addEventListener('click', closeHandler);

  const {
    scale,
    scaleFit,
    scale100,
    rotate,
    rotateReset,
    rotateLeft,
    rotateRight,
    reverse,
    border,
    render,
    backgroundCustom,
    backgroundBright,
    backgroundDark,
  } = getImageControllerFields();
  const { reload, prev, next, imageList } = getImageListSectionFields();
  const searchButton = element.querySelector<HTMLButtonElement>('#search')!;

  const updateState = (options: Options) => {
    if (STATE.currentImageElement) {
      setImageData(STATE.currentImageElement, {
        ...options,
      });
    }
  };

  scale.addEventListener('input', () => {
    const value = Number(scale.value);

    updateState({
      scale: Number.isNaN(value) ? defaultState.scale : value,
    });
  });

  scaleFit.addEventListener('click', () => {
    if (STATE.currentImageElement) {
      updateState({
        scale: 100,
      });
      zoomAndScrollInit(STATE.currentImageElement, 'fit');
    }
  });

  scale100.addEventListener('click', () => {
    updateState({
      scale: 100,
    });
  });

  rotate.addEventListener('input', () => {
    const value = Number(rotate.value);

    updateState({
      rotate: Number.isNaN(value) ? defaultState.rotate : value,
    });
  });

  rotateLeft.addEventListener('click', () => {
    updateState({
      rotate: (Number(rotate.value) || 0) + -90,
    });
  });

  rotateRight.addEventListener('click', () => {
    updateState({
      rotate: (Number(rotate.value) || 0) + 90,
    });
  });

  rotateReset.addEventListener('click', () => {
    updateState({
      rotate: 0,
    });
  });

  reverse.addEventListener('input', () => {
    updateState({
      reverse: reverse.checked,
    });
  });

  border.addEventListener('input', () => {
    STATE.hasBorder = border.checked;
    updateState({});
  });

  reload.addEventListener('click', () => {
    applyImageList();
  });
  next.addEventListener('click', () => {
    const current = imageList.querySelector<HTMLButtonElement>('[aria-current="true"]');
    const target = current?.closest('li')?.nextElementSibling?.firstElementChild;

    if (target instanceof HTMLButtonElement) {
      target?.click();

      return;
    }

    const roopTarget =
      current?.closest('ul')?.firstElementChild?.firstElementChild ??
      imageList.querySelector('button');

    if (roopTarget instanceof HTMLButtonElement) {
      roopTarget?.click();
    }
  });
  prev.addEventListener('click', () => {
    const current = imageList.querySelector<HTMLButtonElement>('[aria-current="true"]');
    const target = current?.closest('li')?.previousElementSibling?.firstElementChild;

    if (target instanceof HTMLButtonElement) {
      target?.click();

      return;
    }

    const roopTarget =
      current?.closest('ul')?.lastElementChild?.firstElementChild ??
      imageList.querySelector('button');

    if (roopTarget instanceof HTMLButtonElement) {
      roopTarget?.click();
    }
  });

  searchButton.addEventListener('click', () => {
    if (!STATE.currentImageElement) {
      return;
    }

    const data = getImageData(STATE.currentImageElement);

    if (data.isInDialog) {
      if (data.origin) {
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
          alert(chrome.i18n.getMessage('searched_image_error'));

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
        point.textContent = chrome.i18n.getMessage('searched_image_message');
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
      }
    }
  });

  const stopPropagation = (e: Event) => e.stopPropagation();
  scale.addEventListener('wheel', stopPropagation);
  rotate.addEventListener('wheel', stopPropagation);
  imageList.addEventListener('wheel', stopPropagation);
  imageList.addEventListener('keydown', (e) => {
    e.stopPropagation();

    if (e.key.startsWith('Arrow')) {
      e.preventDefault();
    }
  });

  // bgcolor
  const inputEvent = new Event('input');

  backgroundBright.addEventListener('click', () => {
    backgroundCustom.value = '#fafafa';
    backgroundCustom.dispatchEvent(inputEvent);
  });
  backgroundDark.addEventListener('click', () => {
    backgroundCustom.value = '#202124';
    backgroundCustom.dispatchEvent(inputEvent);
  });

  backgroundCustom.addEventListener('input', () => {
    dialog.style.cssText = `--canvas-background: ${backgroundCustom.value}`;
    void chrome.storage.local.set({
      background: backgroundCustom.value,
    });
  });

  chrome.storage.local.get('background', ({ background }) => {
    if (typeof background === 'string' && background) {
      backgroundCustom.value = background;
      backgroundCustom.dispatchEvent(inputEvent);
    }
  });

  const resolveRenderMode = (value: string): RenderingMode => {
    const types: RenderingMode[] = ['crisp-edges', 'pixelated', 'smooth', 'high-quality'];
    const isInvalid = (value: string): value is RenderingMode =>
      types.some((type) => type === value);

    if (isInvalid(value)) {
      return value;
    }

    return defaultState.render;
  };

  render.addEventListener('change', () => {
    updateState({
      render: resolveRenderMode(render.value),
    });
  });

  const ui = document.createDocumentFragment();

  ui.append(closeBtnForPortrait);
  ui.append(element);

  return ui;
};
