import { IMAGE_LIST_COLS } from '@/contexts/content-scripts/constants';

export const onImageListKeydown = (e: KeyboardEvent) => {
  const self = e.currentTarget;

  if (e.altKey || e.ctrlKey) {
    return;
  }

  if (self instanceof HTMLButtonElement) {
    const buttons = [...(self.closest('ul')?.querySelectorAll<HTMLButtonElement>('button') ?? [])];
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
            Math.floor((buttons.length - (buttons.length % IMAGE_LIST_COLS)) / IMAGE_LIST_COLS) *
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
