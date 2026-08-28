import { CONTENT_UI } from '@/contexts/content-scripts/ui';
import type { getImageControllerFields } from '../renderers';

const { dialog } = CONTENT_UI;

type BackgroundFields = Pick<
  ReturnType<typeof getImageControllerFields>,
  'backgroundCustom' | 'backgroundBright' | 'backgroundDark'
>;

export const addEventBackgroundControllers = ({
  backgroundCustom,
  backgroundBright,
  backgroundDark,
}: BackgroundFields) => {
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
};
