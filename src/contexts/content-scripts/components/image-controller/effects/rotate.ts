import type { ImageControllerFields } from '@/contexts/content-scripts/components/image-controller/renderers';
import { updateState } from '@/contexts/content-scripts/components/image-controller/utils';
import { defaultState } from '@/contexts/content-scripts/utils';

type RotateFields = Pick<
  ImageControllerFields,
  'rotate' | 'rotateReset' | 'rotateLeft' | 'rotateRight'
>;

export const addEventRotateControllers = ({
  rotate,
  rotateReset,
  rotateLeft,
  rotateRight,
}: RotateFields) => {
  rotate.addEventListener('input', () => {
    const value = Number(rotate.value);

    updateState({
      rotate: Number.isNaN(value) ? defaultState.rotate : value,
    });
  });

  rotateLeft.addEventListener('click', () => {
    updateState({
      rotate: (Number(rotate.value) || 0) + -90,
    });
  });

  rotateRight.addEventListener('click', () => {
    updateState({
      rotate: (Number(rotate.value) || 0) + 90,
    });
  });

  rotateReset.addEventListener('click', () => {
    updateState({
      rotate: 0,
    });
  });

  rotate.addEventListener('wheel', (e) => {
    e.stopPropagation();
  });
};
