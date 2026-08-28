import { buildImageController } from './build-image-controller';

type ImageControllerFields = Omit<ReturnType<typeof buildImageController>, 'element'>;

let fields: ImageControllerFields | undefined;

export const renderImageController = (container: Element | DocumentFragment) => {
  const { element, ...rest } = buildImageController();

  fields = rest;
  container.append(element);
};

export const getImageControllerFields = () => {
  if (!fields) {
    throw new Error('renderImageController must be called before getImageControllerFields');
  }

  return fields;
};
