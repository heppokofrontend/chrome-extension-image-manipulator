import type { ImageControllerFields } from '@/contexts/content-scripts/components/image-controller/renderers';
import { updateState } from '@/contexts/content-scripts/components/image-controller/utils';
import { STATE } from '@/contexts/content-scripts/state';

type ReverseAndBorderFields = Pick<ImageControllerFields, 'reverse' | 'border'>;

export const addEventReverseAndBorderControllers = ({
  reverse,
  border,
}: ReverseAndBorderFields) => {
  reverse.addEventListener('input', () => {
    updateState({
      isReversed: reverse.checked,
    });
  });

  border.addEventListener('input', () => {
    STATE.hasBorder = border.checked;
    updateState({});
  });
};
