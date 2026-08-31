import { STATE } from '@/contexts/content-scripts/state';
import { CONTENT_UI } from '@/contexts/content-scripts/ui';

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

export const renderCanvas = () => {
  if (!isInitialized) {
    isInitialized = true;
    initCanvas();
  }

  const spaceElement = CONTENT_UI.spaceElement;

  spaceElement.textContent = '';

  if (STATE.currentImageElement) {
    spaceElement.append(STATE.currentImageElement);
  }
};
