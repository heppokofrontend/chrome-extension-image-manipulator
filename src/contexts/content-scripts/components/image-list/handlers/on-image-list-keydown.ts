import { IMAGE_LIST_COLS } from '@/contexts/content-scripts/constants';

export const onImageListKeydown = (e: KeyboardEvent) => {
  const button = e.currentTarget;

  if (e.altKey || e.ctrlKey) {
    return;
  }

  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  const buttons = [...(button.closest('ul')?.querySelectorAll<HTMLButtonElement>('button') ?? [])];
  const index = buttons.indexOf(button);

  if (e.key.startsWith('Arrow')) {
    e.preventDefault();
  }

  switch (e.key) {
    case 'Home':
      buttons[0]?.click();
      break;
    case 'End':
      buttons.at(-1)?.click();
      break;
    case 'ArrowRight':
      (buttons[index + 1] || buttons[0])?.click();
      break;
    case 'ArrowLeft':
      (buttons[index - 1] || buttons.at(-1))?.click();
      break;
    case 'ArrowUp': {
      const lastRowStart = Math.floor(buttons.length / IMAGE_LIST_COLS) * IMAGE_LIST_COLS;
      (
        buttons[index - IMAGE_LIST_COLS] ||
        buttons[lastRowStart + index] ||
        buttons[lastRowStart + index - IMAGE_LIST_COLS]
      )?.click();
      break;
    }
    case 'ArrowDown': {
      const column = index % IMAGE_LIST_COLS;
      (buttons[index + IMAGE_LIST_COLS] || buttons[column])?.click();
      break;
    }
  }
};
