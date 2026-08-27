import { ROTATE_ICON, SPINNER } from '@/contexts/content-scripts/assets';
import { IMAGE_LIST_COLS, IMAGE_LIST_GAP } from '@/contexts/content-scripts/constants';
import { buildDialogElement, buildStyleElement } from '@/contexts/content-scripts/renderer';

let currentImageElement: HTMLImageElement | null = null;
let hasBorder = false;
const SELECTOR = 'img, svg, [style*="url("]';
const imageDataMap: Map<HTMLImageElement, StyleData> = new Map();
const convertedSvgMap: Map<SVGElement, HTMLImageElement> = new Map();
const convertedImgToSVGMap: Map<HTMLImageElement, SVGElement> = new Map();
const convertedDummyMap: Map<HTMLElement, HTMLImageElement> = new Map();
const convertedImgToDummyMap: Map<HTMLImageElement, HTMLElement> = new Map();
const convertSVGToImg = (img: SVGElement) => {
  const pseudoImage = (() => {
    const pseudo = convertedSvgMap.get(img);

    if (pseudo) {
      return pseudo;
    }

    const element = document.createElement('img');
    convertedSvgMap.set(img, element);
    convertedImgToSVGMap.set(element, img);
    return element;
  })();

  img.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  const svgData = img.outerHTML;
  pseudoImage.src = 'data:image/svg+xml,' + encodeURIComponent(svgData);
  return pseudoImage;
};
const convertDummyElementToImg = (img: HTMLElement) => {
  const pseudo = convertedDummyMap.get(img);

  if (pseudo) {
    return pseudo;
  }

  const element = document.createElement('img');
  const { backgroundImage } = getComputedStyle(img);

  if (backgroundImage === 'none') {
    return null;
  }

  element.src = backgroundImage.replace(/url\("(.*)"\)/, '$1');

  convertedDummyMap.set(img, element);
  convertedImgToDummyMap.set(element, img);
  return element;
};
const defaultState: StyleData = {
  isInDialog: false,
  clonedImage: null,
  scale: 100,
  oldScale: 100,
  rotate: 0,
  reverse: false,
  render: 'crisp-edges',
  fileSize: 'loading...',
  fileType: 'loading...',
};
const getImageData = (key: HTMLImageElement) => {
  if (!imageDataMap.has(key)) {
    imageDataMap.set(key, { ...defaultState });
  }

  return { ...imageDataMap.get(key) } as StyleData;
};
const createSetImageData = ({
  canvas,
  spaceElement,
  setInputValues,
}: {
  canvas: HTMLDivElement;
  spaceElement: HTMLDivElement;
  setInputValues: (imageData: StyleData) => void;
}) => {
  return (img: HTMLImageElement, options: Options, noNeedInitScreen: boolean = false) => {
    if (!img) {
      return;
    }

    const baseImageData = getImageData(img);
    const oldScale = baseImageData.scale;
    const imageData = {
      ...baseImageData,
      ...options,
      oldScale,
    } as StyleData;

    imageDataMap.set(img, {
      ...imageData,
    });

    if (noNeedInitScreen) {
      return;
    }

    // TODO: ダイアログの外でいじったのを中に伝搬させる。内から外は対応しない。
    const { isInDialog } = imageData;
    const rotate = `rotateZ(${imageData.rotate}deg)`;
    const reverse = imageData.reverse ? 'rotateY(180deg)' : '';
    const scale = `scale(${imageData.scale / 100})`;

    img.style.transform = `${rotate} ${reverse} ${isInDialog ? '' : scale}`;

    if (hasBorder) {
      img.classList.add('has-border');
    } else {
      img.classList.remove('has-border');
    }

    if (isInDialog) {
      const getSize = (img: HTMLImageElement, scale: number) => {
        const width = img.naturalWidth * (scale / 100);
        const height = img.naturalHeight * (scale / 100);
        const contentWidth = ((canvas.clientWidth ?? 0) + width / 2) * 2 - 10;
        const contentHeight = ((canvas.clientHeight ?? 0) + height / 2) * 2 - 10;

        return {
          spaceSize: {
            width: contentWidth,
            height: contentHeight,
          },
        };
      };

      const { scale, oldScale, render } = imageData;
      const { spaceSize } = getSize(img, scale);
      const olsSpaceSize = getSize(img, oldScale).spaceSize;

      img.style.width = '';
      img.style.height = '';
      img.style.imageRendering = '';
      img.style.cssText = `
        ${img.getAttribute('style')}
        width: ${img.naturalWidth * (scale / 100)}px !important;
        height: ${img.naturalHeight * (scale / 100)}px !important;
        image-rendering: ${render} !important;
      `;

      spaceElement.style.cssText = `
        width: ${spaceSize.width}px !important;
        height: ${spaceSize.height}px !important;
      `;

      const diffWidth = (olsSpaceSize.width - spaceSize.width) / 2;
      const diffHeight = (olsSpaceSize.height - spaceSize.height) / 2;
      const { scrollTop, scrollLeft } = canvas;

      canvas.scroll({
        top: scrollTop - diffHeight,
        left: scrollLeft - diffWidth,
      });

      setInputValues(imageData);
    }
  };
};

const { imageViewer, showDialog, dialogContains, setImageData } = (() => {
  const dialog = buildDialogElement();
  const { details, formControls } = (() => {
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

      <div id="details-main">
        <div id="readonly">
          <p class="row">
            <label class="label" for="alt">${chrome.i18n.getMessage('readOnly_alt')}</label>
            <span class="control">
              <input
                id="alt"
                value=""
                readonly
              />
            </span>
          </p>
          <p class="row">
            <label class="label" for="url">${chrome.i18n.getMessage('readOnly_url')}</label>
            <span class="control">
              <input
                id="url"
                value=""
                readonly
              />
            </span>
          </p>
          <p class="row">
            <label class="label" for="type">${chrome.i18n.getMessage('readOnly_fileType')}</label>
            <span class="control">
              <input
                id="type"
                value=""
                class="right"
                readonly
              />
            </span>
          </p>
          <p class="row">
            <label class="label" for="size">${chrome.i18n.getMessage('readOnly_fileSize')}</label>
            <span class="control">
              <input
                id="size"
                value=""
                class="right"
                readonly
              />
            </span>
          </p>
          <p class="row">
            <label class="label" for="natural-width">${chrome.i18n.getMessage(
              'readOnly_naturalWidth',
            )}</label>
            <span class="control">
              <input
                id="natural-width"
                value=""
                class="right"
                readonly
              />
            </span>
          </p>
          <p class="row">
            <label class="label" for="natural-height">${chrome.i18n.getMessage(
              'readOnly_naturalHeight',
            )}</label>
            <span class="control">
              <input
                id="natural-height"
                value=""
                class="right"
                readonly
              />
            </span>
          </p>
          <p class="row">
            <label class="label" for="aspect">${chrome.i18n.getMessage('readOnly_aspect')}</label>
            <span class="control">
              <input
                id="aspect"
                value=""
                class="right"
                readonly
              />
            </span>
          </p>

          ${
            /*
          <p class="row">
            <label class="label" for="srcset-${ratio}">srcset ${ratio}</label>
            <span class="control">
              <input
                id="srcset-${ratio}"
                value=""
                readonly
              />
            </span>
          </p>
          */
            ''
          }
        </div>
      </div>

      <div id="editable">
        <div class="checkbox-group">
          <p class="row">
            <label class="label" for="reverse">${chrome.i18n.getMessage('editable_reverse')}</label>
            <span class="control">
              <span class="checkbox">
                <input
                  id="reverse"
                  type="checkbox"
                />
              </span>
            </span>
          </p>

          <p class="row">
            <label class="label" for="border">${chrome.i18n.getMessage('editable_border')}</label>
            <span class="control">
              <span class="checkbox shared">
                <input
                  id="border"
                  type="checkbox"
                />
              </span>
            </span>
          </p>
        </div>

        <div class="row" role="group" aria-labelledby="scale-legend">
          <p class="label" id="scale-legend">
            <label for="scale">${chrome.i18n.getMessage('editable_scale')}</label>
          </p>
          <p class="control">
            <span class="field">
              <button type="button" id="scale-fit">FIT</button>
              <button type="button" id="scale-100">100%</button>
              <input
                type="number"
                name="scale"
                id="scale"
                value=""
                step="1"
                min="1"
                class="right"
              />
            </span>
            <span class="unit">%</span>
          </p>
        </div>

        <div class="row" role="group" aria-labelledby="rotate-legend">
          <p class="label" id="rotate-legend">
            <label for="rotate">${chrome.i18n.getMessage('editable_rotate')}</label>
          </p>
          <p class="control">
            <span class="field">
              <button type="button" id="rotate-reset">RESET</button>
              <button type="button" id="rotate-left" title="${chrome.i18n.getMessage(
                'rotate_left',
              )}">
                ${ROTATE_ICON}
              </button>
              <button type="button" id="rotate-right" title="${chrome.i18n.getMessage(
                'rotate_right',
              )}">
                ${ROTATE_ICON}
              </button>
              <input
                type="number"
                name="rotate"
                id="rotate"
                value=""
                step="1"
                min="-360"
                max="360"
                class="right"
              />
              <span class="unit">deg</span>
            </span>
          </p>
        </div>

        <p class="row">
          <label class="label" for="render">${chrome.i18n.getMessage('editable_render')}</label>
          <span class="control">
            <select
              id="render"
            >
            ${['crisp-edges', 'pixelated', 'smooth', 'high-quality']
              .map((value) => {
                return `<option>${value}</option>`;
              })
              .join('')}
            </select>
          </span>
        </p>

        <div class="group" id="color" role="group" aria-labelledby="background-label">
          <p id="background-label" class="legend">${chrome.i18n.getMessage(
            'editable_background',
          )}</p>
          <div class="control">
            <p class="button">
              <input type="color" aria-label="${chrome.i18n.getMessage(
                'editable_background_custom',
              )}" id="background-custom" value="#202124" />
            </p>
            <p class="button">
              <button type="button" id="background-bright">${chrome.i18n.getMessage(
                'editable_background_bright',
              )}</button>
            </p>
            <p class="button">
              <button type="button" id="background-dark">${chrome.i18n.getMessage(
                'editable_background_dark',
              )}</button>
            </p>
          </div>
        </div>
      </div>

      <div id="image-list-section" role="group" aria-labelledby="image-list-label">
        <div id="image-list-header">
          <p id="image-list-label" class="legend">${chrome.i18n.getMessage('image_list_title')}</p>

          <div id="image-list-buttons">
            <p><button type="button" id="image-list-reload">${chrome.i18n.getMessage(
              'image_list_reload',
            )}</button></p>
            <p><button type="button" id="image-list-prev">${chrome.i18n.getMessage(
              'image_list_prev',
            )}</button></p>
            <p><button type="button" id="image-list-next">${chrome.i18n.getMessage(
              'image_list_next',
            )}</button></p>
          </div>
        </div>

        <div id="image-list-wrapper" title="${chrome.i18n.getMessage('image_list_description')}">
          <ul id="image-list"></ul>
        </div>

        <p id="image-list-info">
          ${chrome.i18n.getMessage('image_list_info')}
          <span id="image-list-info-text" aria-live="polite"></span>
        </p>
      </div>

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

    const url = element.querySelector<HTMLInputElement>('#url')!;
    const alt = element.querySelector<HTMLInputElement>('#alt')!;
    const size = element.querySelector<HTMLInputElement>('#size')!;
    const type = element.querySelector<HTMLInputElement>('#type')!;
    const naturalWidth = element.querySelector<HTMLInputElement>('#natural-width')!;
    const naturalHeight = element.querySelector<HTMLInputElement>('#natural-height')!;
    const aspect = element.querySelector<HTMLInputElement>('#aspect')!;
    // const srcset = element.querySelector<HTMLInputElement>('#srcset')!;
    const scale = element.querySelector<HTMLInputElement>('#scale')!;
    const scaleFit = element.querySelector<HTMLInputElement>('#scale-fit')!;
    const scale100 = element.querySelector<HTMLInputElement>('#scale-100')!;
    const rotate = element.querySelector<HTMLInputElement>('#rotate')!;
    const rotateReset = element.querySelector<HTMLButtonElement>('#rotate-reset')!;
    const rotateLeft = element.querySelector<HTMLButtonElement>('#rotate-left')!;
    const rotateRight = element.querySelector<HTMLButtonElement>('#rotate-right')!;
    const reverse = element.querySelector<HTMLInputElement>('#reverse')!;
    const border = element.querySelector<HTMLInputElement>('#border')!;
    const render = element.querySelector<HTMLSelectElement>('#render')!;
    const imageListButtons = {
      reload: element.querySelector<HTMLButtonElement>('#image-list-reload')!,
      prev: element.querySelector<HTMLButtonElement>('#image-list-prev')!,
      next: element.querySelector<HTMLButtonElement>('#image-list-next')!,
    };
    const imageList = element.querySelector<HTMLElement>('#image-list')!;
    const imageListInfo = element.querySelector<HTMLElement>('#image-list-info-text')!;
    const searchButton = element.querySelector<HTMLButtonElement>('#search')!;

    const updateState = (options: Options) => {
      if (currentImageElement) {
        setImageData(currentImageElement, {
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
      if (currentImageElement) {
        updateState({
          scale: 100,
        });
        zoomAndScrollInit(currentImageElement, 'fit');
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
      hasBorder = border.checked;
      updateState({});
    });

    imageListButtons.reload.addEventListener('click', () => {
      createImageList();
    });
    imageListButtons.next.addEventListener('click', () => {
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
    imageListButtons.prev.addEventListener('click', () => {
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
      if (!currentImageElement) {
        return;
      }

      const data = getImageData(currentImageElement);

      if (data.isInDialog) {
        if (data.origin) {
          const origin = (() => {
            if (document.body.contains(data.origin)) {
              return data.origin;
            }

            if (data.origin instanceof HTMLImageElement) {
              return (
                convertedImgToSVGMap.get(data.origin) ?? convertedImgToDummyMap.get(data.origin)
              );
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
    const custom = element.querySelector<HTMLInputElement>('#background-custom');
    const bright = element.querySelector<HTMLButtonElement>('#background-bright');
    const dark = element.querySelector<HTMLButtonElement>('#background-dark');
    const inputEvent = new Event('input');

    if (custom) {
      bright?.addEventListener('click', () => {
        custom.value = '#fafafa';
        custom.dispatchEvent(inputEvent);
      });
      dark?.addEventListener('click', () => {
        custom.value = '#202124';
        custom.dispatchEvent(inputEvent);
      });

      custom.addEventListener('input', () => {
        dialog.style.cssText = `--canvas-background: ${custom.value}`;
        void chrome.storage.local.set({
          background: custom.value,
        });
      });

      chrome.storage.local.get('background', ({ background }) => {
        if (typeof background === 'string' && background) {
          custom.value = background;
          custom.dispatchEvent(inputEvent);
        }
      });
    }

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

    return {
      details: ui,
      formControls: {
        url,
        alt,
        size,
        type,
        naturalWidth,
        naturalHeight,
        aspect,
        // srcset,
        scale,
        rotate,
        reverse,
        border,
        render,
        imageList,
        imageListInfo,
      },
    };
  })();
  const dialogContains = (image: HTMLImageElement) => {
    return image ? spaceElement.contains(image) : false;
  };
  const setInputValues = (imageData: StyleData) => {
    if (!imageData.isInDialog || !currentImageElement) {
      return;
    }

    formControls.url.value = currentImageElement.src;
    // alt 以外のアクセシブルネームをサポートするかどうか
    formControls.alt.value = currentImageElement.alt;
    formControls.size.value = imageData.fileSize;
    formControls.type.value = imageData.fileType;
    formControls.naturalWidth.value = `${currentImageElement.naturalWidth} px`;
    formControls.naturalHeight.value = `${currentImageElement.naturalHeight} px`;

    const getAspectRatio = (width: number, height: number) => {
      const getGCD = (a: number, b: number): number => {
        if (b === 0) {
          return a;
        }

        return getGCD(b, a % b);
      };

      const gcd = getGCD(width, height);
      const ratio = `${width / gcd} : ${height / gcd}`;

      return ratio;
    };

    formControls.aspect.value = getAspectRatio(
      currentImageElement.naturalWidth,
      currentImageElement.naturalHeight,
    );

    // formControls.srcset.value = hhhhhhh
    formControls.scale.value = String(imageData.scale);
    formControls.rotate.value = String(imageData.rotate);
    formControls.reverse.checked = imageData.reverse;
    formControls.border.checked = hasBorder;
    formControls.render.value = imageData.render;
  };

  const { canvas, spaceElement } = (() => {
    const outer = document.createElement('div');
    const inner = document.createElement('div');
    const moveState = {
      clientY: 0,
      clientX: 0,
      startY: 0,
      startX: 0,
    };
    const moveHandler = (e: MouseEvent) => {
      outer.scroll({
        top: moveState.startY + moveState.clientY - e.clientY,
        left: moveState.startX + moveState.clientX - e.clientX,
      });
    };

    outer.addEventListener('mousedown', (e) => {
      if (e.button !== 0) {
        return;
      }

      e.preventDefault();

      moveState.clientY = e.clientY;
      moveState.clientX = e.clientX;
      moveState.startX = outer.scrollLeft ?? 0;
      moveState.startY = outer.scrollTop ?? 0;
      window.addEventListener('mousemove', moveHandler);
    });

    outer.addEventListener('wheel', (e) => {
      e.preventDefault();

      if (!currentImageElement) {
        return;
      }

      const imageData = getImageData(currentImageElement);
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

      setImageData(currentImageElement, {
        ...imageData,
      });
    });

    window.addEventListener('mouseup', () => {
      window.removeEventListener('mousemove', moveHandler);
    });

    window.addEventListener('mouseleave', () => {
      window.removeEventListener('mousemove', moveHandler);
    });

    outer.id = 'canvas';
    inner.id = 'canvas-inner';
    outer.append(inner);

    return {
      canvas: outer,
      spaceElement: inner,
    };
  })();
  const setImageData = createSetImageData({ canvas, spaceElement, setInputValues });
  const style = buildStyleElement();
  const imageViewer = document.createElement('heppokofrontend-imagemanipulator');
  const shadowRoot = imageViewer.attachShadow({ mode: 'closed' });
  const zoomAndScrollInit = (
    targetImage: HTMLImageElement,
    scaleValue?: number | 'init' | 'fit',
  ) => {
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
  const resizeSupport = () => {
    let setTimeoutId = -1;
    const wheelEvent = new Event('wheel');

    window.addEventListener('resize', () => {
      clearTimeout(setTimeoutId);

      setTimeoutId = setTimeout(() => {
        if (dialog.open && currentImageElement) {
          canvas.dispatchEvent(wheelEvent);
          zoomAndScrollInit(currentImageElement);
        }
      }, 300);
    });
  };
  const createImageList = (() => {
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
            currentImageElement = originalElement;
          } else if (originalElement instanceof SVGElement) {
            const svg = convertedSvgMap.get(originalElement);

            if (svg) {
              currentImageElement = svg;
            }
          } else {
            const dummy = convertedDummyMap.get(originalElement);

            if (dummy) {
              currentImageElement = dummy;
            }
          }

          if (!currentImageElement) {
            return;
          }

          if (button.getAttribute('aria-current') !== 'true') {
            void showDialog({ noCreateImageList: true });
          }
        });
        button.addEventListener('keydown', onkeydown);

        listItem.className = 'image-list-item';
        button.className = 'image-list-item-button';

        if (currentImageElement?.src === src) {
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
      formControls.imageList.textContent = '';
      formControls.imageList.append(fragment);

      const buttons = [...formControls.imageList.querySelectorAll('button')];
      const current = buttons.find((button) => button.getAttribute('aria-current') === 'true');
      const currentIndex = current ? buttons.indexOf(current) : -1;
      const viewCurrentIndex = () => {
        formControls.imageListInfo.textContent = `${currentIndex + 1} / ${buttons.length}`;
      };

      if (noRecreate) {
        viewCurrentIndex();

        if (current) {
          // scrollIntoView() だと常に上辺か下辺に張り付くため、自前で実装
          const imageListRect = formControls.imageList.getBoundingClientRect();
          const targetRect = current.getBoundingClientRect();
          const isNotVisibleTop = targetRect.top < imageListRect.top - IMAGE_LIST_GAP;
          const isNotVisibleBottom = imageListRect.bottom < targetRect.top + IMAGE_LIST_GAP;

          if (isNotVisibleTop) {
            setTimeout(() => {
              formControls.imageList.scrollBy(
                0,
                targetRect.top - imageListRect.top - IMAGE_LIST_GAP,
              );
            }, 0);
          } else if (isNotVisibleBottom) {
            setTimeout(() => {
              formControls.imageList.scrollBy(
                0,
                targetRect.bottom - imageListRect.bottom + IMAGE_LIST_GAP,
              );
            }, 0);
          }
        }

        current?.focus();
      } else {
        imagesCache = images;
        formControls.imageList.classList.add('invisible');

        setTimeout(() => {
          formControls.imageList.classList.remove('invisible');
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

  const getFileSize = (image: HTMLImageElement) => {
    return new Promise<void>((done) => {
      const isSVG = image.src.startsWith('data:image/svg+xml');

      if (isSVG) {
        const size = new Blob([image.src]).size;

        setImageData(image, {
          fileSize: size ? `${size} byte` : chrome.i18n.getMessage('error_fileSize'),
          fileType: 'image/svg+xml (in HTML)',
        });

        done();
        return;
      }

      const { protocol } = new URL(image.src);

      fetch(image.src.replace(protocol, location.protocol), { method: 'HEAD' })
        .then(({ headers }) => {
          const size = headers.get('Content-Length');
          const type = headers.get('Content-Type');

          setImageData(image, {
            fileSize: size ? `${size} byte` : chrome.i18n.getMessage('error_fileSize'),
            fileType: type ?? chrome.i18n.getMessage('error_fileType'),
          });
        })
        .catch(() => {
          setImageData(image, {
            fileSize: chrome.i18n.getMessage('error_fileSize'),
            fileType: chrome.i18n.getMessage('error_fileType'),
          });
        })
        .finally(() => {
          done();
        });
    });
  };

  return {
    imageViewer,
    showDialog: async (option?: { noCreateImageList?: boolean }) => {
      const noCreateImageList = option?.noCreateImageList ?? false;

      if (!dialog.open) {
        dialog.showModal();
      }

      const showImageInDialog = async (resolve: () => void) => {
        if (!currentImageElement) {
          return;
        }

        const imageData = getImageData(currentImageElement);
        const initialScale = (() => {
          if (
            !('clonedImage' in imageData) ||
            !(imageData.clonedImage instanceof HTMLImageElement)
          ) {
            return null;
          }

          return getImageData(imageData.clonedImage).scale;
        })();

        if (!imageData.isInDialog) {
          if (imageData.clonedImage === null) {
            dialog.setAttribute('aria-busy', 'true');
            spaceElement.classList.add('loading');

            const clonedImage = new Image();

            clonedImage.alt = currentImageElement.alt;
            clonedImage.src = currentImageElement.src;
            clonedImage.width = currentImageElement.width;
            clonedImage.height = currentImageElement.height;

            const isError = await new Promise<boolean>((done) => {
              clonedImage.onload = () => done(false);
              clonedImage.onerror = () => done(true);
            });

            if (isError) {
              console.log('Chrome Extension Image Manipulator: 404 ERROR', currentImageElement);
              dialog.removeAttribute('aria-busy');
              spaceElement.classList.remove('loading');
              return;
            }

            // ダイアログ用の画像は別で管理する
            setImageData(clonedImage, {
              ...imageData,
              isInDialog: true,
              origin: currentImageElement,
            });

            setImageData(currentImageElement, {
              clonedImage,
            });

            currentImageElement = clonedImage;

            // 容量の解決
            await getFileSize(clonedImage).finally(() => {
              dialog.removeAttribute('aria-busy');
              spaceElement.classList.remove('loading');
              zoomAndScrollInit(clonedImage, imageData.scale);
            });
          } else {
            currentImageElement = imageData.clonedImage;
            resolve();
          }
        }

        spaceElement.textContent = '';
        spaceElement.append(currentImageElement);

        createImageList(noCreateImageList);

        if (dialog.open) {
          formControls.imageList.querySelector<HTMLButtonElement>('[aria-current="true"]')?.focus();
        } else {
          dialog.showModal();
        }

        zoomAndScrollInit(currentImageElement, initialScale || 'init');
        setInputValues(imageData);
        resolve();
      };

      return await new Promise<void>((resolve) => {
        void showImageInDialog(resolve);
      });
    },
    dialogContains,
    setImageData,
  };
})();

const resolveTarget = (target: EventTarget | null) => {
  const getElement = () => {
    if (target === null || (!(target instanceof HTMLElement) && !(target instanceof SVGElement))) {
      return null;
    }

    if (currentImageElement instanceof HTMLImageElement && target === imageViewer) {
      return currentImageElement;
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

  const img = getElement();

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

chrome.runtime.onMessage.addListener(({ menuItemId }: { menuItemId: string }, _, sendResponse) => {
  const targetElement = currentImageElement;

  sendResponse(true);

  if (menuItemId === 'reset-all') {
    const nodeList = [
      ...(targetElement ? [targetElement] : []),
      ...document.querySelectorAll<HTMLImageElement>('[data-image-manipulator-default-style]'),
    ];

    nodeList.forEach((image) => {
      const imageData = getImageData(image);

      setImageData(image, {
        ...defaultState,
        oldScale: imageData.oldScale,
        fileSize: imageData.fileSize,
      });

      if (!imageData.isInDialog && imageData.clonedImage) {
        const clonedImageData = getImageData(imageData.clonedImage);

        setImageData(imageData.clonedImage, {
          ...defaultState,
          isInDialog: true,
          oldScale: clonedImageData.oldScale,
          fileSize: clonedImageData.fileSize,
        });
      }

      if (typeof image.dataset['imageManipulatorDefaultStyle'] === 'string') {
        image.setAttribute('style', image.dataset['imageManipulatorDefaultStyle']);
      }
    });

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
        if (isInDialog) {
          targetElement.removeAttribute('style');

          setImageData(targetElement, {
            ...defaultState,
            isInDialog,
            oldScale: imageData.oldScale,
            fileSize: imageData.fileSize,
          });
        } else {
          if (typeof targetElement.dataset['imageManipulatorDefaultStyle'] === 'string') {
            targetElement.setAttribute(
              'style',
              targetElement.dataset['imageManipulatorDefaultStyle'],
            );
          }
        }

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

window.addEventListener('contextmenu', ({ target }) => {
  const targetImage = resolveTarget(target);

  if (!(targetImage instanceof HTMLImageElement)) {
    currentImageElement = null;
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

      currentImageElement = targetImage;
    }
  }
});
