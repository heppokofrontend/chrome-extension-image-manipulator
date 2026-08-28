import { STATE } from '@/contexts/content-scripts/state';
import { defaultState, zoomAndScrollInit } from '@/contexts/content-scripts/utils';
import type { getImageControllerFields } from '../renderers';
import { updateState } from '../utils';

type ScaleFields = Pick<
  ReturnType<typeof getImageControllerFields>,
  'scale' | 'scaleFit' | 'scale100'
>;

export const addEventScaleControllers = ({ scale, scaleFit, scale100 }: ScaleFields) => {
  scale.addEventListener('input', () => {
    const value = Number(scale.value);

    updateState({
      scale: Number.isNaN(value) ? defaultState.scale : value,
    });
  });

  scaleFit.addEventListener('click', () => {
    if (STATE.currentImageElement) {
      updateState({ scale: 100 });
      zoomAndScrollInit(STATE.currentImageElement, 'fit');
    }
  });

  scale100.addEventListener('click', () => {
    updateState({ scale: 100 });
  });

  scale.addEventListener('wheel', (e) => e.stopPropagation());
};
