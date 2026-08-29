import type { getImageControllerFields } from '@/contexts/content-scripts/components/image-controller/renderers';
import { updateState } from '@/contexts/content-scripts/components/image-controller/utils';
import { STATE } from '@/contexts/content-scripts/state';

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
