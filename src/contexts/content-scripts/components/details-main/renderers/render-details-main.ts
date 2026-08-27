import { buildDetailsMain } from './build-details-main';

type DetailsMainFields = Omit<ReturnType<typeof buildDetailsMain>, 'element'>;

let fields: DetailsMainFields | undefined;

export const renderDetailsMain = (container: Element | DocumentFragment) => {
  const { element, ...rest } = buildDetailsMain();

  fields = rest;
  container.append(element);
};

export const getDetailsMainFields = () => {
  if (!fields) {
    throw new Error('renderDetailsMain must be called before getDetailsMainFields');
  }

  return fields;
};
