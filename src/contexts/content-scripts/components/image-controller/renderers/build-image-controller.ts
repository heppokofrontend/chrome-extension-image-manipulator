import { ROTATE_ICON_SVG } from '@/contexts/content-scripts/assets';
import { nonNullableQuerySelector } from '@/contexts/content-scripts/utils';
import { getMessage } from '@/utils';

const RENDER_MODES: RenderingMode[] = ['crisp-edges', 'pixelated', 'smooth', 'high-quality'];

export const buildImageController = () => {
  const element = document.createElement('div');

  element.innerHTML = `
    <div class="checkbox-group">
      <p class="row">
        <label class="label" for="reverse">${getMessage('editable_reverse')}</label>
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
        <label class="label" for="border">${getMessage('editable_border')}</label>
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
        <label for="scale">${getMessage('editable_scale')}</label>
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
        <label for="rotate">${getMessage('editable_rotate')}</label>
      </p>
      <p class="control">
        <span class="field">
          <button type="button" id="rotate-reset">RESET</button>
          <button type="button" id="rotate-left" title="${getMessage('rotate_left')}">
            ${ROTATE_ICON_SVG}
          </button>
          <button type="button" id="rotate-right" title="${getMessage('rotate_right')}">
            ${ROTATE_ICON_SVG}
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
      <label class="label" for="render">${getMessage('editable_render')}</label>
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
      <p id="background-label" class="legend">${getMessage('editable_background')}</p>
      <div class="control">
        <p class="button">
          <input type="color" aria-label="${getMessage(
            'editable_background_custom',
          )}" id="background-custom" value="#202124" />
        </p>
        <p class="button">
          <button type="button" id="background-bright">${getMessage(
            'editable_background_bright',
          )}</button>
        </p>
        <p class="button">
          <button type="button" id="background-dark">${getMessage(
            'editable_background_dark',
          )}</button>
        </p>
      </div>
    </div>
  `;

  const fields = {
    reverse: nonNullableQuerySelector<HTMLInputElement>('#reverse', element),
    border: nonNullableQuerySelector<HTMLInputElement>('#border', element),
    scale: nonNullableQuerySelector<HTMLInputElement>('#scale', element),
    scaleFit: nonNullableQuerySelector<HTMLButtonElement>('#scale-fit', element),
    scale100: nonNullableQuerySelector<HTMLButtonElement>('#scale-100', element),
    rotate: nonNullableQuerySelector<HTMLInputElement>('#rotate', element),
    rotateReset: nonNullableQuerySelector<HTMLButtonElement>('#rotate-reset', element),
    rotateLeft: nonNullableQuerySelector<HTMLButtonElement>('#rotate-left', element),
    rotateRight: nonNullableQuerySelector<HTMLButtonElement>('#rotate-right', element),
    render: nonNullableQuerySelector<HTMLSelectElement>('#render', element),
    backgroundCustom: nonNullableQuerySelector<HTMLInputElement>('#background-custom', element),
    backgroundBright: nonNullableQuerySelector<HTMLButtonElement>('#background-bright', element),
    backgroundDark: nonNullableQuerySelector<HTMLButtonElement>('#background-dark', element),
  };

  const fragment = document.createDocumentFragment();

  fragment.append(...element.childNodes);

  return { fragment, ...fields };
};
