import {
  addEventBackgroundControllers,
  addEventRenderControllers,
  addEventReverseAndBorderControllers,
  addEventRotateControllers,
  addEventScaleControllers,
} from '@/contexts/content-scripts/components/image-controller/effects';

import { buildImageController } from './build-image-controller';

type ImageControllerFields = Omit<ReturnType<typeof buildImageController>, 'element'>;

let fields: ImageControllerFields | undefined;

export const renderImageController = (container: Element | DocumentFragment) => {
  const { element, ...rest } = buildImageController();

  fields = rest;
  container.append(element);

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
