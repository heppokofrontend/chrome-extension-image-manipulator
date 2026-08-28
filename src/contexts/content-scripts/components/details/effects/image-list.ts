import {
  applyImageList,
  getImageListSectionFields,
} from '@/contexts/content-scripts/components/image-list-section';

type ImageListFields = Pick<
  ReturnType<typeof getImageListSectionFields>,
  'reload' | 'prev' | 'next' | 'imageList'
>;

export const addEventImageListControllers = ({
  reload,
  prev,
  next,
  imageList,
}: ImageListFields) => {
  reload.addEventListener('click', () => {
    applyImageList();
  });

  next.addEventListener('click', () => {
    const current = imageList.querySelector<HTMLButtonElement>('[aria-current="true"]');
    const target = current?.closest('li')?.nextElementSibling?.firstElementChild;

    if (target instanceof HTMLButtonElement) {
      target?.click();

      return;
    }

    const roopTarget =
      current?.closest('ul')?.firstElementChild?.firstElementChild ??
      imageList.querySelector('button');

    if (roopTarget instanceof HTMLButtonElement) {
      roopTarget?.click();
    }
  });

  prev.addEventListener('click', () => {
    const current = imageList.querySelector<HTMLButtonElement>('[aria-current="true"]');
    const target = current?.closest('li')?.previousElementSibling?.firstElementChild;

    if (target instanceof HTMLButtonElement) {
      target?.click();

      return;
    }

    const roopTarget =
      current?.closest('ul')?.lastElementChild?.firstElementChild ??
      imageList.querySelector('button');

    if (roopTarget instanceof HTMLButtonElement) {
      roopTarget?.click();
    }
  });

  imageList.addEventListener('wheel', (e) => e.stopPropagation());
  imageList.addEventListener('keydown', (e) => {
    e.stopPropagation();

    if (e.key.startsWith('Arrow')) {
      e.preventDefault();
    }
  });
};
