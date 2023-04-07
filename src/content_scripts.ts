let currentImageElement: HTMLImageElement | null = null;
const imageDataMap: Map<HTMLImageElement, StyleData> = new Map();
const defaultState: StyleData = {
  isInDialog: false,
  clonedImage: null,
  scale: 100,
  oldScale: 100,
  rotate: 0,
  reverse: false,
  render: 'crisp-edges',
  fileSize: 'loading...',
};
const { imageViewer, dialog, showDialog, dialogContains, getImageData, setImageData } = (() => {
  const getImageData = (key: HTMLImageElement) => {
    if (!imageDataMap.has(key)) {
      imageDataMap.set(key, { ...defaultState });
    }

    return { ...imageDataMap.get(key) } as StyleData;
  };
  const dialog = (() => {
    const element = document.createElement('dialog');

    element.role = 'dialog';
    element.ariaModal = 'true';
    element.ariaLabel = 'Image Viewer';
    element.addEventListener('keydown', (e) => {
      if (e.key === 'ESC') {
        e.preventDefault();
        e.stopPropagation();
        dialog.close();
      }
    });

    return element;
  })();
  const setImageData = (img: HTMLImageElement, options: Options) => {
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

    // TODO: ダイアログの外でいじったのを中に伝搬させる。内から外は対応しない。
    const { isInDialog } = imageData;
    const rotate = `rotateZ(${imageData.rotate}deg)`;
    const reverse = imageData.reverse ? 'rotateY(180deg)' : '';
    const scale = isInDialog ? '' : `scale(${imageData.scale / 100})`;

    img.style.transform = `${rotate} ${reverse} ${scale}`;

    if (isInDialog) {
      const getSize = (img: HTMLImageElement, scale: number) => {
        const width = img.naturalWidth * (scale / 100);
        const height = img.naturalHeight * (scale / 100);
        const diagonal = Math.hypot(width, height);
        const min = diagonal + 20;
        const contentWidth = (canvas.clientWidth ?? 0) * 2 - width;
        const contentHeight = (canvas.clientHeight ?? 0) * 2 - height;

        return {
          width,
          height,
          spaceSize: {
            width: Math.max(min, contentWidth),
            height: Math.max(min, contentHeight),
          },
        };
      };
      const { scale, oldScale, render } = imageData;
      const { width, height, spaceSize } = getSize(img, scale);
      const olsSpaceSize = getSize(img, oldScale).spaceSize;

      img.style.width = '';
      img.style.height = '';
      img.style.imageRendering = '';
      img.style.cssText = `
        ${img.getAttribute('style')}
        width: ${width}px !important;
        height: ${height}px !important;
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
  const { details, formControls } = (() => {
    const element = document.createElement('div');

    element.id = 'details';
    element.insertAdjacentHTML(
      'afterbegin',
      `
      <p class="close">
        <button type="button">${chrome.i18n.getMessage('button_close')}</button>
      </p>

      <div id="readonly">
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

      <div id="editable">
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
          <label class="label" for="render">${chrome.i18n.getMessage('editable_render')}</label>
          <span class="control">
            <select
              id="render"
            >
            ${['crisp-edges', 'pixelated', 'smooth', 'high-quality'].map((value) => {
              return `<option>${value}</option>`;
            })}
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
    `,
    );

    element.querySelector('button')?.addEventListener('click', () => {
      dialog.close();
    });

    const url = element.querySelector<HTMLInputElement>('#url')!;
    const alt = element.querySelector<HTMLInputElement>('#alt')!;
    const size = element.querySelector<HTMLInputElement>('#size')!;
    const naturalWidth = element.querySelector<HTMLInputElement>('#natural-width')!;
    const naturalHeight = element.querySelector<HTMLInputElement>('#natural-height')!;
    const aspect = element.querySelector<HTMLInputElement>('#aspect')!;
    // const srcset = element.querySelector<HTMLInputElement>('#srcset')!;
    const scale = element.querySelector<HTMLInputElement>('#scale')!;
    const scaleFit = element.querySelector<HTMLInputElement>('#scale-fit')!;
    const scale100 = element.querySelector<HTMLInputElement>('#scale-100')!;
    const rotate = element.querySelector<HTMLInputElement>('#rotate')!;
    const rotateReset = element.querySelector<HTMLInputElement>('#rotate-reset')!;
    const reverse = element.querySelector<HTMLInputElement>('#reverse')!;
    const render = element.querySelector<HTMLSelectElement>('#render')!;

    const updateState = (options: Options) => {
      if (currentImageElement) {
        setImageData(currentImageElement, {
          ...options,
        });
      }
    };

    scale.addEventListener('input', () => {
      updateState({
        scale: Number(scale.value) ?? defaultState.scale,
      });
    });

    scaleFit.addEventListener('click', () => {
      if (currentImageElement) {
        updateState({
          scale: 100,
        });
        zoomAndScrollInit(currentImageElement, 100);
      }
    });

    scale100.addEventListener('click', () => {
      updateState({
        scale: 100,
      });
    });

    rotate.addEventListener('input', () => {
      updateState({
        rotate: Number(rotate.value) ?? defaultState.rotate,
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
        canvas.style.cssText = `--canvas-background: ${custom.value}`;
        chrome.storage.local.set({
          background: custom.value,
        });
      });

      chrome.storage.local.get('background', ({ background }) => {
        if (background) {
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

    return {
      details: element,
      formControls: {
        url,
        alt,
        size,
        naturalWidth,
        naturalHeight,
        aspect,
        // srcset,
        scale,
        rotate,
        reverse,
        render,
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

    outer.style.cssText = '--canvas-background: #202124';
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
  const style = (() => {
    const element = document.createElement('style');
    const convertToCSSText = (
      css: Record<string, Record<string, string | number>>,
      mediaQuery: string = '',
    ) => {
      let cssText = mediaQuery === '' ? '' : `${mediaQuery} {`;

      for (const [selector, styleObject] of Object.entries(css)) {
        let values = '';

        for (const [propertyName, value] of Object.entries(styleObject)) {
          values += `${propertyName}: ${value}; `;
        }

        cssText += ` ${selector} {${values}}`;
      }

      return `${cssText.trim()}${mediaQuery === '' ? '' : '}'}`;
    };

    element.dataset.from = 'chrome-extension-image-viewer';
    element.textContent = convertToCSSText({
      ':host': {
        display: 'block !important',
        position: 'fixed !important',
        left: '0 !important',
        top: '0 !important',
      },
      '*': {
        'box-sizing': 'border-box',
        padding: 0,
        margin: 0,
      },
      ':focus': {
        outline: 'none',
      },
      ':focus-visible': {
        'box-shadow': '0 0 0 2px #fff',
      },
      img: {
        position: 'absolute',
        inset: '0',
        margin: 'auto',
      },
      button: {
        color: '#111',
      },
      '.close': {
        'text-align': 'right',
        margin: '0 0 20px',
      },
      '.close button': {
        padding: '10px',
        background: '#42ccc0',
        border: 0,
        'border-radius': '6px',
        'min-width': '100px',
        'font-size': 'inherit',
      },
      dialog: {
        'font-size': '14px',
        position: 'fixed',
        inset: '0px',
        margin: 'auto',
        padding: '0',
        width: '90%',
        height: '90%',
        'max-width': 'calc(100% - 20px)',
        'max-height': 'calc(100% - 20px)',
        color: '#fff',
        background: '#282828',
        visibility: 'visible',
        overflow: 'hidden',
        opacity: '1',
        'box-sizing': 'border-box',
        border: 0,
        'border-radius': '4px',
        'box-shadow': '0 0 10px 0 rgb(0 0 0 / 80%)',
      },
      'dialog::backdrop': {
        background: 'rgb(0 0 0 / 40%)',
      },
      'dialog:not([open])': {
        display: 'none !important',
      },
      '#canvas, #details': {
        height: '100%',
      },
      '#canvas': {
        display: 'grid',
        'place-items': 'center',
        'max-height': '80%',
        overflow: 'hidden',
        cursor: 'move',
        background: 'var(--canvas-background)',
      },
      '#canvas-inner': {
        display: 'block',
        position: 'relative',
      },
      '#details': {
        padding: '20px 14px',
        background: '#292a2d',
        border: '2px solid #424242',
        'box-sizing': 'border-box',
        'max-height': '20%',
        overflow: 'auto',
      },
      '#details input, #details select': {
        padding: '8px 6px 8px 4px',
        color: 'inherit',
        'font-size': 'inherit',
        'line-height': 'inherit',
        border: '0',
        outline: 'none',
        background: 'transparent',
        'border-radius': '4px',
      },
      '#details .row, #details .group': {
        display: 'grid',
        'grid-template-columns': '140px 1fr',
      },
      '#details .row .label, #details .group .legend': {
        display: 'grid',
        'align-items': 'center',
        padding: '0 8px',
      },
      '#details .row .control': {
        display: 'grid',
        'align-items': 'center',
        'grid-template-columns': '1fr auto',
        'padding-right': '8px',
      },
      '#details .row .field': {
        display: 'flex',
        background: '#1d1d1e',
        'border-radius': '4px',
      },
      '#details .row .field button': {
        'font-size': '11px',
        'font-family': 'monospace',
        'min-width': '40px',
        padding: '2px 0 0',
        margin: '4px 0 4px 4px',
        'border-radius': '4px',
        background: '#f0f0f0',
        border: '2px solid #1d1d1e',
      },
      '#details .row .field button:last-of-type': {
        'margin-right': '4px',
      },
      '#details .row .field button:hover': {
        opacity: '0.8',
      },
      '#details .row .field input': {
        padding: '8px 6px 8px 4px',
        width: '100%',
      },
      '#details .group .control': {
        display: 'grid',
        gap: '20px',
      },
      '#details input': {
        'grid-column': '1 / 2',
      },
      '#details input:last-child, #details select:last-child': {
        'grid-column': '1 / 3',
      },
      '#details .unit': {
        padding: '8px 4px',
        'grid-column': '2 / 3',
        'min-width': '2.5em',
      },
      '#details input[type="checkbox"]': {
        inset: '0',
        position: 'absolute',
        opacity: '0',
        'z-index': 1,
      },
      '#details select': {
        width: '100%',
      },
      '#details option': {
        color: '#fff',
        background: '#515254',
      },
      '::-webkit-outer-spin-button, ::-webkit-inner-spin-button': {
        '-webkit-appearance': 'none',
        margin: 0,
      },
      '#readonly': {
        background: '#515254',
        'border-radius': '4px',
        margin: '0 0 20px',
      },
      '#readonly p:not(:first-child)': {
        'border-top': '1px solid #3f4042',
      },
      '#readonly .unit': {
        'padding-left': 0,
      },
      '#editable input:not([type="checkbox"]), #editable select': {
        background: '#1d1d1e',
      },
      '#editable .row:not(:first-child), #editable .group:not(:first-child)': {
        margin: '12px 0 0',
      },

      '.checkbox': {
        position: 'relative',
        display: 'block',
        width: '80px',
        'min-height': '37px',
        'margin-left': 'auto',
      },
      '.checkbox::before, .checkbox::after': {
        position: 'absolute',
        top: '0',
        right: '0',
        bottom: '0',
        display: 'block',
        margin: 'auto 0',
        content: '""',
      },
      '.checkbox::before': {
        'z-index': '1',
        width: '32px',
        height: '32px',
        background: '#f0f3f4',
        'border-radius': '50%',
        'box-shadow': '0 0 3px rgb(0 0 0 / 60%)',
        transition: '0.2s right ease-out',
      },
      '.checkbox::after': {
        width: '72px',
        height: '32px',
        background: '#42ccc0',
        'border-radius': '20px',
        'box-shadow': '0 0 3px rgb(0 0 0 / 60%) inset',
        transition: '0.2s background-color ease-out',
      },
      '.checkbox:has(input:not(:checked))::before': {
        right: '39px',
      },
      '.checkbox:has(input:not(:checked))::after': {
        'background-color': '#cbd7db',
      },
      '.checkbox:has(input:focus-visible)::after': {
        'box-shadow': '0 0 3px rgb(0 0 0 / 60%) inset, 0 0 0 2px #fff',
      },
      '.right': {
        'text-align': 'right',
      },

      '#details #color': {
        padding: '20px 0 0',
        'border-top': '1px solid #6a6a6a',
        margin: '20px 0 0',
      },
      '#details #color .control': {
        'grid-template-columns': 'auto auto 1fr',
      },
      '#details #color #background-bright, #details #color #background-dark, #details #color #background-custom':
        {
          width: '44px',
          height: '44px',
          display: 'block',
          color: 'transparent',
          'user-select': 'none',
          overflow: 'hidden',
          padding: 0,
          'border-radius': '4px',
        },
      '#details #color #background-bright, #details #color #background-dark': {
        border: '2px solid #000',
      },
      '#details #color #background-bright': {
        background: '#fff',
      },
      '#details #color #background-dark': {
        background: '#202124',
      },
      '#details #color #background-custom': {
        border: '4px double #6a6a6a',
      },
      '#details #color #background-custom::-webkit-color-swatch-wrapper': {
        padding: 0,
      },
      '#details #color #background-custom::-webkit-color-swatch': {
        border: 0,
      },
    });
    element.textContent += convertToCSSText(
      {
        dialog: {
          display: 'grid !important',
          'grid-template-columns': '1fr 450px',
        },
        '#canvas': {
          'max-height': 'none !important',
        },
        '#details': {
          'max-height': 'none',
        },
      },
      '@media (orientation: landscape)',
    );

    return element;
  })();
  const imageViewer = document.createElement('image-viewer');
  const shadowRoot = imageViewer.attachShadow({ mode: 'closed' });
  const zoomAndScrollInit = (targetImage: HTMLImageElement, scaleValue?: number) => {
    const scale = scaleValue ?? getImageData(targetImage).scale;

    if (scale === 100) {
      const fitHeight = (canvas.offsetHeight - 60) / targetImage.naturalHeight;
      const fitWidth = (canvas.offsetWidth - 60) / targetImage.naturalWidth;
      const result = Math.floor(Math.min(fitHeight, fitWidth) * 100);

      if (result <= 100) {
        setImageData(targetImage, {
          scale: result,
        });
      }
    }

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

  dialog.append(canvas);
  dialog.append(details);
  shadowRoot.appendChild(style);
  shadowRoot.appendChild(dialog);
  document.body.appendChild(imageViewer);
  resizeSupport();

  return {
    imageViewer,
    dialog,
    showDialog: async () => {
      if (dialog.open) {
        return;
      }

      return await new Promise<void>(async (resolve) => {
        if (!currentImageElement) {
          return;
        }

        const imageData = getImageData(currentImageElement);

        if (!imageData.isInDialog) {
          if (imageData.clonedImage === null) {
            const clonedImage = new Image();

            clonedImage.alt = currentImageElement.alt;
            clonedImage.src = currentImageElement.src;
            clonedImage.width = currentImageElement.width;
            clonedImage.height = currentImageElement.height;

            await new Promise<void>((done) => {
              clonedImage.onload = () => done();
            });

            new Promise<void>((done) => {
              fetch(clonedImage.src, { method: 'HEAD' })
                .then(({ headers }) => {
                  const size = headers.get('Content-Length');

                  setImageData(clonedImage, {
                    fileSize: size ? `${size} byte` : chrome.i18n.getMessage('error_fileSize'),
                  });
                })
                .catch(() => {
                  setImageData(clonedImage, {
                    fileSize: chrome.i18n.getMessage('error_fileSize'),
                  });
                })
                .finally(() => {
                  zoomAndScrollInit(clonedImage, imageData.scale);
                  done();
                });
            });

            // ダイアログ用の画像は別で管理する
            setImageData(clonedImage, {
              ...imageData,
              isInDialog: true,
            });

            setImageData(currentImageElement, {
              clonedImage,
            });

            currentImageElement = clonedImage;
          } else {
            currentImageElement = imageData.clonedImage;
            resolve();
          }
        }

        spaceElement.textContent = '';
        spaceElement.append(currentImageElement);
        dialog.showModal();

        zoomAndScrollInit(currentImageElement, imageData.scale);
        setInputValues(imageData);
        resolve();
      });
    },
    dialogContains,
    getImageData,
    setImageData,
  };
})();

const resolveTarget = (target: EventTarget | null) => {
  const getElement = () => {
    if (target === null || !(target instanceof HTMLElement)) {
      return null;
    }

    if (currentImageElement instanceof HTMLImageElement && target === imageViewer) {
      return currentImageElement;
    }

    if (target instanceof HTMLImageElement) {
      return target;
    }

    const childrenImages = target.querySelectorAll('img, svg');

    if (childrenImages.length === 1) {
      return childrenImages[0];
    }

    const imagesFromParent = target.parentElement?.querySelectorAll('img, svg');

    if (imagesFromParent?.length === 1) {
      return imagesFromParent[0];
    }

    const focusableOrSemanticContextsImages = target
      .closest('a, button, [tabindex], [aria-label], [role="button"], [role="link"]')
      ?.querySelectorAll('img, svg');

    if (focusableOrSemanticContextsImages?.length === 1) {
      return focusableOrSemanticContextsImages[0];
    }

    const { backgroundImage } = getComputedStyle(target);

    if (backgroundImage === 'none') {
      return null;
    }

    const pseudoImage = new Image();

    pseudoImage.src = backgroundImage.replace(/url\("(.*)"\)/, '$1');

    return pseudoImage;
  };

  const img = getElement();

  if (img instanceof SVGElement) {
    const svgData = new XMLSerializer().serializeToString(img);
    const pseudoImage = document.createElement('img');

    pseudoImage.src =
      'data:image/svg+xml;base64,' + btoa(decodeURIComponent(encodeURIComponent(svgData)));
    return pseudoImage;
  }

  return img;
};

chrome.runtime.onMessage.addListener(({ menuItemId }, _, sendResponse) => {
  const targetElement = currentImageElement;

  sendResponse(true);

  if (menuItemId === 'reset-all') {
    const nodeList = [
      ...(targetElement ? [targetElement] : []),
      ...document.querySelectorAll<HTMLImageElement>('[data-image-viewer-default-style]'),
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

      if (typeof image.dataset.imageViewerDefaultStyle === 'string') {
        image.setAttribute('style', image.dataset.imageViewerDefaultStyle);
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
          if (typeof targetElement.dataset.imageViewerDefaultStyle === 'string') {
            targetElement.setAttribute('style', targetElement.dataset.imageViewerDefaultStyle);
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

        show();

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
    console.log('Chrome Extension Image Viewer: No image');

    return;
  }

  if (targetImage) {
    const isInDialog = dialogContains(targetImage);

    if (!isInDialog) {
      if (typeof targetImage.dataset.imageViewerDefaultStyle !== 'string') {
        targetImage.dataset.imageViewerDefaultStyle = targetImage.getAttribute('style') || '';
      }

      currentImageElement = targetImage;
    }
  }
});
