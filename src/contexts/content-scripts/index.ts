import { SPINNER } from '@/contexts/content-scripts/assets';
import { renderDetails } from '@/contexts/content-scripts/components/details';
import { onMessage, onContextmenu } from '@/contexts/content-scripts/handlers';
import { buildStyleElement } from '@/contexts/content-scripts/renderers';
import { STATE } from '@/contexts/content-scripts/state';
import { CONTENT_UI } from '@/contexts/content-scripts/ui';
import { getImageData, setImageData, zoomAndScrollInit } from '@/contexts/content-scripts/utils';

const { imageViewer, dialog, canvas } = CONTENT_UI;

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

const details = renderDetails();

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

chrome.runtime.onMessage.addListener(onMessage);

window.addEventListener('contextmenu', onContextmenu);
