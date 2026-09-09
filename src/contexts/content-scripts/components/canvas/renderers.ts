import { STATE } from '@/contexts/content-scripts/state';
import { CONTENT_UI } from '@/contexts/content-scripts/ui';
import { getMessage } from '@/utils';

import { onCanvasWheel } from './handlers';

let isInitialized = false;
const initCanvas = () => {
  const outer = CONTENT_UI.canvas;
  const inner = CONTENT_UI.spaceElement;
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
    moveState.startX = outer.scrollLeft;
    moveState.startY = outer.scrollTop;
    window.addEventListener('mousemove', moveHandler);
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
  outer.addEventListener('wheel', onCanvasWheel);
};

interface Params {
  isEmpty: boolean;
}

export const renderCanvas = (params?: Params) => {
  if (!isInitialized) {
    isInitialized = true;
    initCanvas();
  }

  const spaceElement = CONTENT_UI.spaceElement;
  const isEmpty = params?.isEmpty === true;

  spaceElement.textContent = '';

  if (isEmpty) {
    spaceElement.insertAdjacentHTML(
      'afterbegin',
      `<span>${getMessage('error_imageNotDetected')}</span>`,
    );
  }

  // isEmpty のときは STATE.currentImageElement が 404 前の古い画像を指したままの
  // こともあるため、空状態メッセージだけを表示し画像は付け直さない。
  if (!isEmpty && STATE.currentImageElement) {
    spaceElement.append(STATE.currentImageElement);
  }
};
