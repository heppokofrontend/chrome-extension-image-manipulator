import { STATE } from '@/contexts/content-scripts/state';
import type { getImageControllerFields } from '../renderers';
import { updateState } from '../utils';

type ReverseAndBorderFields = Pick<
  ReturnType<typeof getImageControllerFields>,
  'reverse' | 'border'
>;

export const addEventReverseAndBorderControllers = ({
  reverse,
  border,
}: ReverseAndBorderFields) => {
  reverse.addEventListener('input', () => {
    updateState({
      reverse: reverse.checked,
    });
  });

  border.addEventListener('input', () => {
    STATE.hasBorder = border.checked;
    updateState({});
  });
};
