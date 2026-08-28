import { SPINNER } from '@/contexts/content-scripts/assets';
import {
  getImageControllerFields,
  renderImageController,
} from '@/contexts/content-scripts/components/image-controller';
import { renderImageInfo } from '@/contexts/content-scripts/components/image-info';
import {
  getImageListSectionFields,
  renderImageListSection,
} from '@/contexts/content-scripts/components/image-list-section';
import { IMAGE_LIST_COLS, IMAGE_LIST_GAP, SELECTOR } from '@/contexts/content-scripts/constants';
import { resetAll, resetCurrent } from '@/contexts/content-scripts/features';
import { onContextmenu } from '@/contexts/content-scripts/handlers/on-contextmenu';
import { buildStyleElement } from '@/contexts/content-scripts/renderers';
import { STATE } from '@/contexts/content-scripts/state';
import { CONTENT_UI } from '@/contexts/content-scripts/ui';
import {
  convertDummyElementToImg,
  convertedDummyMap,
  convertedImgToDummyMap,
  convertedImgToSVGMap,
  convertedSvgMap,
  convertSVGToImg,
  getFileSize,
  zoomAndScrollInit,
  defaultState,
  getImageData,
  setImageData,
  setInputValues,
} from '@/contexts/content-scripts/utils';

const { imageViewer, dialog, canvas, spaceElement } = CONTENT_UI;

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();

  if (!STATE.currentImageElement) {
    return;
  }

  const imageData = getImageData(STATE.currentImageElement);
  const mode = e.shiftKey ? 'rotate' : 'zoom';

  if (mode === 'rotate') {
    switch (e.deltaY < 0 ? 'right' : 'left') {
      case 'right':
        imageData.rotate += 10;

        if (360 <= imageData.rotate) {
          imageData.rotate -= 360;
        }

        break;

      case 'left':
        imageData.rotate -= 10;

        if (imageData.rotate < 0) {
          imageData.rotate += 360;
        }
        break;
    }
  } else {
    const diff = imageData.scale < 50 ? (imageData.scale < 40 ? 3 : 5) : 10;

    switch (e.deltaY < 0 ? 'in' : 'out') {
      case 'in':
        if (imageData.scale === 1) {
          imageData.scale = diff;
        } else {
          imageData.scale += diff;
        }
        break;

      case 'out':
        imageData.scale -= diff;

        if (imageData.scale <= 0) {
          imageData.scale = 1;
        }
        break;
    }
  }

  setImageData(STATE.currentImageElement, {
    ...imageData,
  });
});

const details = (() => {
  const element = document.createElement('div');
  const closeBtnForPortrait = document.createElement('button');
  const closeHandler = () => {
    dialog.close();
  };

  closeBtnForPortrait.type = 'button';
  closeBtnForPortrait.className = 'close-btn for-portrait';
  closeBtnForPortrait.textContent = chrome.i18n.getMessage('button_close');
  closeBtnForPortrait.addEventListener('click', closeHandler);

  element.id = 'details';
  element.insertAdjacentHTML(
    'afterbegin',
    `
      <p class="close">
        <button type="button" class="close-btn">${chrome.i18n.getMessage('button_close')}</button>
      </p>
    `,
  );

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

  element.querySelector('button')?.addEventListener('click', closeHandler);

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
    createImageList();
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
})();

const style = buildStyleElement();
const shadowRoot = imageViewer.attachShadow({ mode: 'closed' });
const resizeSupport = () => {
  let setTimeoutId = -1;
  const wheelEvent = new Event('wheel');

  window.addEventListener('resize', () => {
    clearTimeout(setTimeoutId);

    setTimeoutId = setTimeout(() => {
      if (dialog.open && STATE.currentImageElement) {
        canvas.dispatchEvent(wheelEvent);
        zoomAndScrollInit(STATE.currentImageElement);
      }
    }, 300);
  });
};
const createImageList = (() => {
  const { imageList, imageListInfo } = getImageListSectionFields();
  // 404の画像があったり、bodyスクロール時に画像が追加されたりすると、画像を切り替えるたびにリストを再生成してチカチカしたりするのでキャッシュしておく
  let imagesCache: {
    src: string;
    alt: string;
    isError: boolean;
    originalElement: SVGElement | HTMLElement;
  }[] = [];

  return (noRecreate: boolean = false) => {
    const fragment = document.createDocumentFragment();
    const images = noRecreate
      ? imagesCache
      : [...document.querySelectorAll<HTMLImageElement | SVGElement | HTMLElement>(SELECTOR)]
          .map((originalElement) => {
            if (originalElement instanceof HTMLImageElement) {
              const result = {
                src: originalElement.src,
                alt: originalElement.alt.trim(),
                isError: false,
                originalElement,
              };

              // support lazyload by script
              const handleLoad = async () => {
                const clonedImage = document.createElement('img');
                result.src = originalElement.src;
                result.alt = originalElement.alt;
                clonedImage.src = originalElement.src;
                clonedImage.alt = originalElement.alt;

                setImageData(
                  originalElement,
                  {
                    clonedImage,
                  },
                  true,
                );
                await getFileSize(clonedImage);
                setImageData(
                  clonedImage,
                  {
                    isInDialog: true,
                    origin: originalElement,
                  },
                  true,
                );
              };

              originalElement.addEventListener('load', () => {
                void handleLoad();
              });
              originalElement.addEventListener('error', () => {
                result.isError = true;
              });

              return result;
            }

            const isSVG = originalElement instanceof SVGElement;
            const pseudoImage = isSVG
              ? convertedSvgMap.get(originalElement)
              : convertedDummyMap.get(originalElement);

            if (pseudoImage) {
              return {
                src: pseudoImage.src,
                alt: pseudoImage.alt,
                isError: false,
                originalElement,
              };
            }

            const newPseudoImage = isSVG
              ? convertSVGToImg(originalElement)
              : convertDummyElementToImg(originalElement);

            if (!newPseudoImage) {
              return null;
            }

            const src = newPseudoImage.src;
            const alt =
              newPseudoImage.getAttribute('aria-label') ??
              newPseudoImage.querySelector('title')?.textContent?.trim() ??
              '';

            return {
              src,
              alt,
              isError: false,
              originalElement,
            };
          })
          .filter((current): current is (typeof imagesCache)[number] => {
            return typeof current !== 'undefined' && current !== null;
          })
          .filter((current, index, self) => {
            return self.findIndex((element) => element?.src === current.src) == index;
          });

    const onkeydown = (e: KeyboardEvent) => {
      const self = e.currentTarget;

      if (e.altKey || e.ctrlKey) {
        return;
      }

      if (self instanceof HTMLButtonElement) {
        const buttons = [
          ...(self.closest('ul')?.querySelectorAll<HTMLButtonElement>('button') ?? []),
        ];
        const index = buttons.indexOf(self);

        if (e.key.startsWith('Arrow')) {
          e.preventDefault();
        }

        switch (e.key) {
          case 'Home':
            buttons[0]?.click();
            break;
          case 'End':
            buttons[buttons.length - 1]?.click();
            break;
          case 'ArrowRight':
            (buttons[index + 1] || buttons[0])?.click();
            break;
          case 'ArrowLeft':
            (buttons[index - 1] || buttons[buttons.length - 1])?.click();
            break;
          case 'ArrowUp': {
            (
              buttons[index - IMAGE_LIST_COLS] ||
              buttons[Math.floor(buttons.length / IMAGE_LIST_COLS) * IMAGE_LIST_COLS + index] ||
              buttons[
                Math.floor(
                  (buttons.length - (buttons.length % IMAGE_LIST_COLS)) / IMAGE_LIST_COLS,
                ) *
                  IMAGE_LIST_COLS +
                  index -
                  IMAGE_LIST_COLS
              ]
            )?.click();
            break;
          }
          case 'ArrowDown': {
            const rest = index % IMAGE_LIST_COLS;
            (buttons[index + IMAGE_LIST_COLS] || buttons[rest] || buttons[0])?.click();
            break;
          }
        }
      }
    };
    const listItems = images.flatMap(({ src, alt, isError, originalElement }, index, self) => {
      if (isError) {
        return [];
      }

      const listItem = document.createElement('li');
      const button = document.createElement('button');

      button.tabIndex = -1;
      button.addEventListener('click', () => {
        if (originalElement instanceof HTMLImageElement) {
          STATE.currentImageElement = originalElement;
        } else if (originalElement instanceof SVGElement) {
          const svg = convertedSvgMap.get(originalElement);

          if (svg) {
            STATE.currentImageElement = svg;
          }
        } else {
          const dummy = convertedDummyMap.get(originalElement);

          if (dummy) {
            STATE.currentImageElement = dummy;
          }
        }

        if (!STATE.currentImageElement) {
          return;
        }

        if (button.getAttribute('aria-current') !== 'true') {
          void showDialog({ noCreateImageList: true });
        }
      });
      button.addEventListener('keydown', onkeydown);

      listItem.className = 'image-list-item';
      button.className = 'image-list-item-button';

      if (STATE.currentImageElement?.src === src) {
        button.setAttribute('aria-current', 'true');
        button.tabIndex = 0;
      }

      button.insertAdjacentHTML('afterbegin', `<img />`);

      const img = button.firstElementChild as HTMLImageElement;

      img.src = src;
      img.onerror = () => {
        listItem.remove();

        const target = self[index];

        if (target) {
          target.isError = true;
        }
      };

      // alt がない時、image_list_no_alt を alt に指定するとここの alt が拾われてしまうため、aria-label を使用する
      if (alt) {
        img.alt = alt;
      } else {
        img.setAttribute('aria-label', chrome.i18n.getMessage('image_list_no_alt'));
      }

      listItem.append(button);

      return listItem;
    });

    fragment.append(...listItems);
    imageList.textContent = '';
    imageList.append(fragment);

    const buttons = [...imageList.querySelectorAll('button')];
    const current = buttons.find((button) => button.getAttribute('aria-current') === 'true');
    const currentIndex = current ? buttons.indexOf(current) : -1;
    const viewCurrentIndex = () => {
      imageListInfo.textContent = `${currentIndex + 1} / ${buttons.length}`;
    };

    if (noRecreate) {
      viewCurrentIndex();

      if (current) {
        // scrollIntoView() だと常に上辺か下辺に張り付くため、自前で実装
        const imageListRect = imageList.getBoundingClientRect();
        const targetRect = current.getBoundingClientRect();
        const isNotVisibleTop = targetRect.top < imageListRect.top - IMAGE_LIST_GAP;
        const isNotVisibleBottom = imageListRect.bottom < targetRect.top + IMAGE_LIST_GAP;

        if (isNotVisibleTop) {
          setTimeout(() => {
            imageList.scrollBy(0, targetRect.top - imageListRect.top - IMAGE_LIST_GAP);
          }, 0);
        } else if (isNotVisibleBottom) {
          setTimeout(() => {
            imageList.scrollBy(0, targetRect.bottom - imageListRect.bottom + IMAGE_LIST_GAP);
          }, 0);
        }
      }

      current?.focus();
    } else {
      imagesCache = images;
      imageList.classList.add('invisible');

      setTimeout(() => {
        imageList.classList.remove('invisible');
        viewCurrentIndex();
        current?.scrollIntoView(false);
      }, 300);
    }
  };
})();

dialog.append(canvas);
dialog.append(details);
canvas.insertAdjacentHTML('afterend', SPINNER);
shadowRoot.appendChild(style);
shadowRoot.appendChild(dialog);
document.body.appendChild(imageViewer);

window.addEventListener('load', () => {
  // for front-end frameworks
  if (!document.body.contains(imageViewer)) {
    document.body.appendChild(imageViewer);
  }
});

resizeSupport();

const showDialog = async (option?: { noCreateImageList?: boolean }) => {
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

chrome.runtime.onMessage.addListener(({ menuItemId }: { menuItemId: string }, _, sendResponse) => {
  const targetElement = STATE.currentImageElement;

  sendResponse(true);

  if (menuItemId === 'reset-all') {
    resetAll();

    return true;
  }

  if (!targetElement) {
    return true;
  }

  const imageData = getImageData(targetElement);
  const { isInDialog } = imageData;

  if (menuItemId.endsWith('%')) {
    setImageData(targetElement, {
      scale: Number(menuItemId.replace(/[^0-9.]/g, '')),
    });
  } else if (menuItemId.endsWith('deg')) {
    setImageData(targetElement, {
      rotate: Number(menuItemId.replace(/[^0-9.]/g, '')),
    });
  } else {
    switch (menuItemId) {
      case 'reset': {
        resetCurrent(isInDialog);

        break;
      }

      case 'reverse':
        setImageData(targetElement, {
          reverse: !imageData.reverse,
        });

        break;

      case 'dialog': {
        const show = async () => {
          await showDialog();
        };

        void show();

        break;
      }
    }
  }

  return true;
});

window.addEventListener('contextmenu', onContextmenu);
