import { objectEntries } from '@/utils';

const buildReadonlyRow = ({
  id,
  labelText,
  className,
}: {
  id: string;
  labelText: string;
  className?: string | undefined;
}) => {
  const row = document.createElement('p');
  const label = document.createElement('label');
  const control = document.createElement('span');
  const input = document.createElement('input');

  row.className = 'row';
  label.className = 'label';
  label.htmlFor = id;
  label.textContent = labelText;
  control.className = 'control';
  input.id = id;
  input.value = '';
  input.readOnly = true;

  if (className) {
    input.className = className;
  }

  control.append(input);
  row.append(label, control);

  return { row, input };
};

type ReadonlyFieldKey =
  'alt' | 'url' | 'type' | 'size' | 'naturalWidth' | 'naturalHeight' | 'aspect';

const toElementId = (field: string) => field.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);

const READONLY_FIELDS: Record<ReadonlyFieldKey, { key: string; className?: string }> = {
  alt: { key: 'readOnly_alt' },
  url: { key: 'readOnly_url' },
  type: { key: 'readOnly_fileType', className: 'right' },
  size: { key: 'readOnly_fileSize', className: 'right' },
  naturalWidth: { key: 'readOnly_naturalWidth', className: 'right' },
  naturalHeight: { key: 'readOnly_naturalHeight', className: 'right' },
  aspect: { key: 'readOnly_aspect', className: 'right' },
};

export const buildDetailsMain = () => {
  const element = document.createElement('div');
  const readonly = document.createElement('div');

  element.id = 'details-main';
  readonly.id = 'readonly';

  const inputElements = {} as Record<ReadonlyFieldKey, HTMLInputElement>;

  for (const [field, { key, className }] of objectEntries(READONLY_FIELDS)) {
    const { row, input } = buildReadonlyRow({
      id: toElementId(field),
      labelText: chrome.i18n.getMessage(key),
      className,
    });

    readonly.append(row);
    inputElements[field] = input;
  }

  element.append(readonly);

  return {
    element,
    alt: inputElements.alt,
    url: inputElements.url,
    type: inputElements.type,
    size: inputElements.size,
    naturalWidth: inputElements.naturalWidth,
    naturalHeight: inputElements.naturalHeight,
    aspect: inputElements.aspect,
  };
};
