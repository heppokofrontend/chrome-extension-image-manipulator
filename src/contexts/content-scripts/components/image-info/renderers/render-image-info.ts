import { CONTENT_UI } from '@/contexts/content-scripts/ui';

import { buildImageInfo } from './build-image-info';

type ImageInfoFields = Omit<ReturnType<typeof buildImageInfo>, 'fragment'>;

let fields: ImageInfoFields | undefined;

export const renderImageInfo = () => {
  const { fragment, ...rest } = buildImageInfo();

  fields = rest;
  CONTENT_UI.imageInfo.append(fragment);
};

export const getImageInfoFields = () => {
  if (!fields) {
    throw new Error('renderImageInfo must be called before getImageInfoFields');
  }

  return fields;
};
