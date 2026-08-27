import { buildImageInfo } from './build-image-info';

type ImageInfoFields = Omit<ReturnType<typeof buildImageInfo>, 'element'>;

let fields: ImageInfoFields | undefined;

export const renderImageInfo = (container: Element | DocumentFragment) => {
  const { element, ...rest } = buildImageInfo();

  fields = rest;
  container.append(element);
};

export const getImageInfoFields = () => {
  if (!fields) {
    throw new Error('renderImageInfo must be called before getImageInfoFields');
  }

  return fields;
};
