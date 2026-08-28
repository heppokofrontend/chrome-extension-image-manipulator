import type { getImageListSectionFields } from '../renderers';
import { applyImageList } from './apply-image-list';

type ImageListControllerFields = Pick<
  ReturnType<typeof getImageListSectionFields>,
  'reload' | 'prev' | 'next' | 'imageList'
>;

type Direction = 'next' | 'prev';

const focusAdjacentImage = (imageList: HTMLElement, direction: Direction) => {
  const current = imageList.querySelector<HTMLButtonElement>('[aria-current="true"]');
  const sibling =
    direction === 'next'
      ? current?.closest('li')?.nextElementSibling
      : current?.closest('li')?.previousElementSibling;
  const target = sibling?.firstElementChild;

  if (target instanceof HTMLButtonElement) {
    target.click();

    return;
  }

  const list = current?.closest('ul');
  const roopTarget =
    (direction === 'next' ? list?.firstElementChild : list?.lastElementChild)?.firstElementChild ??
    imageList.querySelector('button');

  if (roopTarget instanceof HTMLButtonElement) {
    roopTarget.click();
  }
};

export const addEventImageListControllers = ({
  reload,
  prev,
  next,
  imageList,
}: ImageListControllerFields) => {
  reload.addEventListener('click', () => {
    applyImageList();
  });

  next.addEventListener('click', () => {
    focusAdjacentImage(imageList, 'next');
  });

  prev.addEventListener('click', () => {
    focusAdjacentImage(imageList, 'prev');
  });

  imageList.addEventListener('wheel', (e) => e.stopPropagation());
  imageList.addEventListener('keydown', (e) => {
    e.stopPropagation();

    if (e.key.startsWith('Arrow')) {
      e.preventDefault();
    }
  });
};
