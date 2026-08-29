import {
  addEventBackgroundControllers,
  addEventRenderControllers,
  addEventReverseAndBorderControllers,
  addEventRotateControllers,
  addEventScaleControllers,
} from '@/contexts/content-scripts/components/image-controller/effects';
import { STATE } from '@/contexts/content-scripts/state';
import { CONTENT_UI } from '@/contexts/content-scripts/ui';

import { buildImageController } from './build-image-controller';

export type ImageControllerFields = Omit<ReturnType<typeof buildImageController>, 'fragment'>;

let fields: ImageControllerFields | undefined;

export const renderImageController = (
  imageData?: Pick<StyleData, 'scale' | 'rotate' | 'reverse' | 'render'>,
) => {
  if (!fields) {
    const { fragment, ...rest } = buildImageController();

    fields = rest;
    CONTENT_UI.imageController.append(fragment);

    addEventScaleControllers(rest);
    addEventRotateControllers(rest);
    addEventReverseAndBorderControllers(rest);
    addEventRenderControllers(rest);
    addEventBackgroundControllers(rest);
  }

  if (!imageData) {
    return;
  }

  fields.scale.value = String(imageData.scale);
  fields.rotate.value = String(imageData.rotate);
  fields.reverse.checked = imageData.reverse;
  fields.border.checked = STATE.hasBorder;
  fields.render.value = imageData.render;
};
