import type { getImageListSectionFields } from '@/contexts/content-scripts/components/image-list-section/renderers';

import { applyImageList } from './apply-image-list';

type ImageListControllerFields = Pick<
  ReturnType<typeof getImageListSectionFields>,
  'reload' | 'prev' | 'next' | 'imageList'
>;

const focusAdjacentImage = (imageList: HTMLElement, direction: 'next' | 'prev') => {
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
  const loopTarget =
    (direction === 'next' ? list?.firstElementChild : list?.lastElementChild)?.firstElementChild ??
    imageList.querySelector('button');

  if (loopTarget instanceof HTMLButtonElement) {
    loopTarget.click();
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

  imageList.addEventListener('wheel', (e) => {
    e.stopPropagation();
  });
  // TODO: preventDefault は onImageListKeydown 側と重複、stopPropagation の必要性も含めて要調査。
  // 対象ページ側のグローバルショートカット対策で意図的に残っている可能性があり、未確証のまま削除しない。
  imageList.addEventListener('keydown', (e) => {
    e.stopPropagation();

    if (e.key.startsWith('Arrow')) {
      e.preventDefault();
    }
  });
};
