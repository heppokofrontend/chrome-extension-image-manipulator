import {
  addEventBackgroundControllers,
  addEventRenderControllers,
  addEventReverseAndBorderControllers,
  addEventRotateControllers,
  addEventScaleControllers,
} from '@/contexts/content-scripts/components/image-controller/effects';
import { CONTENT_UI } from '@/contexts/content-scripts/ui';

import { buildImageController } from './build-image-controller';

type ImageControllerFields = Omit<ReturnType<typeof buildImageController>, 'fragment'>;

let fields: ImageControllerFields | undefined;

export const renderImageController = () => {
  const { fragment, ...rest } = buildImageController();

  fields = rest;
  CONTENT_UI.imageController.append(fragment);

  addEventScaleControllers(rest);
  addEventRotateControllers(rest);
  addEventReverseAndBorderControllers(rest);
  addEventRenderControllers(rest);
  addEventBackgroundControllers(rest);
};

export const getImageControllerFields = () => {
  if (!fields) {
    throw new Error('renderImageController must be called before getImageControllerFields');
  }

  return fields;
};
