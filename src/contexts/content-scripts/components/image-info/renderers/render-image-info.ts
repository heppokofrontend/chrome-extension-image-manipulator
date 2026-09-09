import { STATE } from '@/contexts/content-scripts/state';
import { CONTENT_UI } from '@/contexts/content-scripts/ui';

import { buildImageInfo } from './build-image-info';

type ImageInfoFields = Omit<ReturnType<typeof buildImageInfo>, 'fragment'>;

let fields: ImageInfoFields | undefined;

const getAspectRatio = (width: number, height: number) => {
  const getGCD = (a: number, b: number): number => {
    if (b === 0) {
      return a;
    }

    return getGCD(b, a % b);
  };

  const gcd = getGCD(width, height);

  return `${width / gcd} : ${height / gcd}`;
};

export const initImageInfo = () => {
  const { fragment, ...rest } = buildImageInfo();

  fields = rest;
  CONTENT_UI.imageInfo.append(fragment);
};

export const renderImageInfo = (fileData: Pick<StyleData, 'fileSize' | 'fileType'>) => {
  const { currentImageElement: image } = STATE;

  if (!fields || !image) {
    return;
  }

  fields.url.value = image.src;
  fields.alt.value = image.alt;
  fields.size.value = fileData.fileSize;
  fields.type.value = fileData.fileType;
  fields.naturalWidth.value = `${image.naturalWidth} px`;
  fields.naturalHeight.value = `${image.naturalHeight} px`;
  fields.aspect.value = getAspectRatio(image.naturalWidth, image.naturalHeight);
};
