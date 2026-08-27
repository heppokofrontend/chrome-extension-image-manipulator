import { IMAGE_LIST_COLS, IMAGE_LIST_GAP } from '@/contexts/content-scripts/constants';

export const createStyleElement = (): HTMLStyleElement => {
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

  element.dataset['from'] = 'chrome-extension-image-manipulator';
  element.textContent = convertToCSSText({
    ':host': {
      display: 'block !important',
      position: 'fixed !important',
      left: '0 !important',
      top: '0 !important',
      '--outline': '2px solid #42ccc0',
      '--outline-offset': '2px',
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
      outline: 'var(--outline)',
      'outline-offset': 'var(--outline-offset)',
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
    '.close-btn': {
      padding: '10px',
      background: '#42ccc0',
      border: 0,
      'border-radius': '6px',
      'min-width': '100px',
      'font-size': 'inherit',
    },
    '.close-btn.for-portrait': {
      position: 'absolute',
      top: '10px',
      right: '10px',
      border: '2px solid #202124',
      '--outline': '2px solid #202124',
    },
    '.close-btn.for-portrait:focus-visible': {
      'box-shadow': '0 0 0 2px #fff',
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
      '--canvas-background': '#202124',
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
      'max-height': '70%',
      overflow: 'hidden',
      cursor: 'move',
      background: 'var(--canvas-background)',
    },
    '#canvas-inner': {
      display: 'block',
      position: 'relative',
      transition: 'opacity 100ms ease-in, visibility 100ms ease-in',
    },
    '#canvas-inner.loading': {
      opacity: 0,
      visibility: 'hidden',
      transition: 'none',
    },
    '#canvas img': {
      border: '1px solid transparent',
      'box-sizing': 'content-box',
    },
    '#canvas img.has-border': {
      outline: '1px solid #fff',
      'border-color': '#000',
    },
    '#spinner': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '70%',
      'pointer-events': 'none',
    },
    '#spinner > svg': {
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
    },
    '#canvas:has(#canvas-inner:not(.loading)) + #spinner': {
      opacity: 0,
    },
    '#details': {
      padding: '20px 14px',
      background: '#292a2d',
      border: '2px solid #424242',
      'box-sizing': 'border-box',
      'max-height': '30%',
      overflow: 'auto',
      'scroll-behavior': 'smooth',
    },
    '#details > .close': {
      display: 'none',
    },
    '#details input, #details select': {
      padding: '8px 6px 8px 4px',
      color: 'inherit',
      'font-size': 'inherit',
      'line-height': 'inherit',
      border: '0',
      background: 'transparent',
      'border-radius': '4px',
    },
    '#details input[readonly], #details select[readonly]': {
      outline: 'none',
      'border-radius': '0',
      'padding-bottom': '4px',
      'border-bottom': '1px solid transparent',
      'margin-bottom': '3px',
    },
    '#details input[readonly]:focus-visible, #details select[readonly]:focus-visible': {
      'border-bottom-color': '#cbd7db',
    },
    '#readonly .row, #editable .row, #editable .group': {
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
      gap: '4px',
      background: '#1d1d1e',
      'border-radius': '4px',
    },
    '#details .row .field button': {
      'font-size': '11px',
      'font-family': 'monospace',
      'min-width': '37px',
      'border-radius': '4px',
      background: '#f0f0f0',
      border: '2px solid #1d1d1e',
      display: 'grid',
      'place-items': 'center',
    },
    '#details .row .field button svg': {
      width: '1.75em',
      height: '1.75em',
    },
    '#details .row .field button#rotate-left svg': {
      transform: 'scaleX(-1) rotate(-243deg)',
    },
    '#details .row .field button#rotate-right svg': {
      transform: 'rotateZ(-243deg)',
    },
    '#details .row .field button:hover': {
      opacity: '0.8',
    },
    '#details .row .field input': {
      padding: '8px 6px 8px 4px',
      width: '100%',
    },
    '#details .checkbox-group': {
      padding: '0 0 20px',
      'border-bottom': '1px solid #6a6a6a',
      display: 'grid',
      'grid-template-columns': '1fr 1fr',
    },
    '#details .checkbox-group .row:not(:host)': {
      'grid-template-columns': '80px 1fr',
    },
    '#details .checkbox-group .row:first-child': {
      'border-right': '1px solid #6a6a6a',
      'padding-right': '20px',
    },
    '#details .checkbox-group .row:last-child': {
      margin: 0,
      'padding-left': '10px',
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
    '#editable .row:not(:first-child)': {
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
    '.checkbox.shared::after': {
      background: '#fdec00',
    },
    '.checkbox:has(input:not(:checked))::before': {
      right: '39px',
    },
    '.checkbox:has(input:not(:checked))::after': {
      'background-color': '#cbd7db',
    },
    '.checkbox:has(input:focus-visible)::after': {
      // 'box-shadow': '0 0 3px rgb(0 0 0 / 60%) inset, 0 0 0 2px #fff',
      outline: 'var(--outline)',
      'outline-offset': 'var(--outline-offset)',
    },
    '.right': {
      'text-align': 'right',
    },
    '#details .group': {
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
    '#image-list-section': {
      display: 'grid',
      'grid-template-rows': 'auto minmax(180px,1fr)',
      padding: '0 8px',
    },
    '#image-list-header': {
      display: 'grid',
      'grid-template-columns': '132px 1fr',
      padding: '40px 0 9px',
      'align-items': 'center',
    },
    '#image-list-buttons': {
      display: 'grid',
      'grid-template-columns': '3fr 2fr 2fr',
      gap: '4px',
    },
    '#image-list-buttons button': {
      width: '100%',
      'font-size': '11px',
      'font-family': 'monospace',
      'min-width': '40px',
      padding: '5px 0 4px',
      'border-radius': '4px',
      background: '#f0f0f0',
      border: '2px solid #1d1d1e',
    },
    '#image-list-wrapper': {
      border: '1px solid #3f4042',
      'border-radius': '4px',
      background: '#515254',
      position: 'relative',
    },
    '#image-list': {
      position: 'absolute',
      top: '0',
      left: '0',
      padding: '8px',
      width: '100%',
      'max-height': '100%',
      display: 'flex',
      'flex-wrap': 'wrap',
      overflow: 'auto',
      'align-items': 'flex-start',
      transition: 'opacity 200ms ease-in, visibility 200ms ease-in',
      'scroll-behavior': 'smooth',
    },
    '#image-list.invisible': {
      opacity: 0,
      visibility: 'hidden',
      transition: 'none',
    },
    '.image-list-item': {
      all: 'unset',
      'max-width': `${100 / IMAGE_LIST_COLS}%`,
      'min-width': `${100 / IMAGE_LIST_COLS}%`,
      padding: `${IMAGE_LIST_GAP / 2}px`,
      'box-sizing': 'border-box',
      'aspect-ratio': '1/1',
    },
    '.image-list-item-button': {
      all: 'unset',
      display: 'block',
      width: '100%',
      height: '100%',
      border: '2px solid transparent',
      'aspect-ratio': '1/1',
      'border-radius': '4px',
      'box-sizing': 'border-box',
      outline: 'inherit',
      background: '#666769',
    },
    '.image-list-item-button:focus-visible': {
      outline: 'var(--outline)',
      'outline-offset': 'var(--outline-offset)',
    },
    '.image-list-item img, .image-list-item svg': {
      position: 'static',
      width: '100%',
      height: 'auto',
      'aspect-ratio': '1/1',
      'object-fit': 'cover',
    },
    '.image-list-item-button[aria-current="true"]': {
      background: 'var(--canvas-background)',
      'border-color': '#42ccc0',
    },
    '.image-list-item-button[aria-current="true"] img, .image-list-item-button[aria-current="true"] svg':
      {
        opacity: '0.2',
      },
    '#image-list-info': {
      'text-align': 'right',
      padding: '6px 0',
    },
    '.search-wrapper': {
      padding: '0 10px 20px',
    },
    '#search': {
      width: '100%',
      'font-size': '12px',
      'font-family': 'monospace',
      padding: '7px 0 6px',
      margin: '4px 0',
      'border-radius': '4px',
      background: '#f0f0f0',
      border: '2px solid #1d1d1e',
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
      '#spinner': {
        width: 'calc(100% - 450px)',
        height: '100%',
      },
      '#details': {
        padding: '0',
        'max-height': 'none',
        display: 'grid',
        'grid-template-rows': 'auto auto auto 1fr',
      },
      '.close-btn.for-portrait': {
        display: 'none',
      },
      '#details > .close': {
        display: 'block',
        position: 'sticky',
        top: '-10px',
        'z-index': 10,
        padding: '20px 14px 10px',
        background: '#292a2dcc',
      },
      '#details-main': {
        padding: '10px 14px 20px',
      },
    },
    '@media (orientation: landscape)',
  );

  return element;
};
