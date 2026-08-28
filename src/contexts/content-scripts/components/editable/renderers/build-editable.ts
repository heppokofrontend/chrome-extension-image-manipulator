import { ROTATE_ICON } from '@/contexts/content-scripts/assets';

const RENDER_MODES: RenderingMode[] = ['crisp-edges', 'pixelated', 'smooth', 'high-quality'];

export const buildEditable = () => {
  const element = document.createElement('div');

  element.id = 'editable';
  element.innerHTML = `
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
          <button type="button" id="rotate-left" title="${chrome.i18n.getMessage('rotate_left')}">
            ${ROTATE_ICON}
          </button>
          <button type="button" id="rotate-right" title="${chrome.i18n.getMessage('rotate_right')}">
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
        ${RENDER_MODES.map((value) => {
          return `<option>${value}</option>`;
        }).join('')}
        </select>
      </span>
    </p>

    <div class="group" id="color" role="group" aria-labelledby="background-label">
      <p id="background-label" class="legend">${chrome.i18n.getMessage('editable_background')}</p>
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
  `;

  return {
    element,
    reverse: element.querySelector<HTMLInputElement>('#reverse')!,
    border: element.querySelector<HTMLInputElement>('#border')!,
    scale: element.querySelector<HTMLInputElement>('#scale')!,
    scaleFit: element.querySelector<HTMLButtonElement>('#scale-fit')!,
    scale100: element.querySelector<HTMLButtonElement>('#scale-100')!,
    rotate: element.querySelector<HTMLInputElement>('#rotate')!,
    rotateReset: element.querySelector<HTMLButtonElement>('#rotate-reset')!,
    rotateLeft: element.querySelector<HTMLButtonElement>('#rotate-left')!,
    rotateRight: element.querySelector<HTMLButtonElement>('#rotate-right')!,
    render: element.querySelector<HTMLSelectElement>('#render')!,
    backgroundCustom: element.querySelector<HTMLInputElement>('#background-custom')!,
    backgroundBright: element.querySelector<HTMLButtonElement>('#background-bright')!,
    backgroundDark: element.querySelector<HTMLButtonElement>('#background-dark')!,
  };
};
