import { addEventImageListControllers } from '@/contexts/content-scripts/components/image-list-section/effects';
import { CONTENT_UI } from '@/contexts/content-scripts/ui';

import { buildImageListSection } from './build-image-list-section';

type ImageListSectionFields = Omit<ReturnType<typeof buildImageListSection>, 'element'>;

let fields: ImageListSectionFields | undefined;

export const renderImageListSection = () => {
  const { element, ...rest } = buildImageListSection();

  fields = rest;
  CONTENT_UI.details.append(element);

  addEventImageListControllers(rest);
};

export const getImageListSectionFields = () => {
  if (!fields) {
    throw new Error('renderImageListSection must be called before getImageListSectionFields');
  }

  return fields;
};
