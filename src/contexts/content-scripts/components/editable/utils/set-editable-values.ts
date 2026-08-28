import { getEditableFields } from '../renderers';
import { STATE } from '@/contexts/content-scripts/state';

export const setEditableValues = (
  imageData: Pick<StyleData, 'scale' | 'rotate' | 'reverse' | 'render'>,
) => {
  const fields = getEditableFields();

  fields.scale.value = String(imageData.scale);
  fields.rotate.value = String(imageData.rotate);
  fields.reverse.checked = imageData.reverse;
  fields.border.checked = STATE.hasBorder;
  fields.render.value = imageData.render;
};
