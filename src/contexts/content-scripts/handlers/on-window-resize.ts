import { STATE } from '@/contexts/content-scripts/state';
import { CONTENT_UI } from '@/contexts/content-scripts/ui';
import { zoomAndScrollInit } from '@/contexts/content-scripts/utils';

const { dialog, canvas } = CONTENT_UI;

let setTimeoutId = -1;
const wheelEvent = new Event('wheel');

export const onWindowResize = () => {
  clearTimeout(setTimeoutId);

  setTimeoutId = setTimeout(() => {
    if (dialog.open && STATE.currentImageElement) {
      canvas.dispatchEvent(wheelEvent);
      zoomAndScrollInit(STATE.currentImageElement);
    }
  }, 300);
};
