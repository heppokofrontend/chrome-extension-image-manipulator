import { defaultState } from '@/contexts/content-scripts/utils';
import type { getImageControllerFields } from '../renderers';
import { updateState } from '../utils';

type RenderFields = Pick<ReturnType<typeof getImageControllerFields>, 'render'>;

const RENDER_MODES: RenderingMode[] = ['crisp-edges', 'pixelated', 'smooth', 'high-quality'];

const resolveRenderMode = (value: string): RenderingMode => {
  const isValid = (value: string): value is RenderingMode =>
    RENDER_MODES.some((mode) => mode === value);

  if (isValid(value)) {
    return value;
  }

  return defaultState.render;
};

export const addEventRenderControllers = ({ render }: RenderFields) => {
  render.addEventListener('change', () => {
    updateState({
      render: resolveRenderMode(render.value),
    });
  });
};
