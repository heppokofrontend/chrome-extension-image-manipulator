import { CONTENT_UI } from '@/contexts/content-scripts/ui';

import { buildImageInfo } from './build-image-info';

type ImageInfoFields = Omit<ReturnType<typeof buildImageInfo>, 'element'>;

let fields: ImageInfoFields | undefined;

export const renderImageInfo = () => {
  const { element, ...rest } = buildImageInfo();

  fields = rest;
  CONTENT_UI.details.append(element);
};

export const getImageInfoFields = () => {
  if (!fields) {
    throw new Error('renderImageInfo must be called before getImageInfoFields');
  }

  return fields;
};
