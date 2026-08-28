import { buildEditable } from './build-editable';

type EditableFields = Omit<ReturnType<typeof buildEditable>, 'element'>;

let fields: EditableFields | undefined;

export const renderEditable = (container: Element | DocumentFragment) => {
  const { element, ...rest } = buildEditable();

  fields = rest;
  container.append(element);
};

export const getEditableFields = () => {
  if (!fields) {
    throw new Error('renderEditable must be called before getEditableFields');
  }

  return fields;
};
