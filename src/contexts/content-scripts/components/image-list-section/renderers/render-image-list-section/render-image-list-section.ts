import { addEventImageListControllers } from '../../effects';
import { buildImageListSection } from './build-image-list-section';

type ImageListSectionFields = Omit<ReturnType<typeof buildImageListSection>, 'element'>;

let fields: ImageListSectionFields | undefined;

export const renderImageListSection = (container: Element | DocumentFragment) => {
  const { element, ...rest } = buildImageListSection();

  fields = rest;
  container.append(element);

  addEventImageListControllers(rest);
};

export const getImageListSectionFields = () => {
  if (!fields) {
    throw new Error('renderImageListSection must be called before getImageListSectionFields');
  }

  return fields;
};
