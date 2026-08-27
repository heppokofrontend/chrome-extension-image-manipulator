import { getDetailsMainFields } from '../renderers';
import { STATE } from '@/contexts/content-scripts/state';

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

export const setDetailsMainValues = (fileData: Pick<StyleData, 'fileSize' | 'fileType'>) => {
  const { currentImageElement: image } = STATE;

  if (!image) {
    return;
  }

  const fields = getDetailsMainFields();

  fields.url.value = image.src;
  fields.alt.value = image.alt;
  fields.size.value = fileData.fileSize;
  fields.type.value = fileData.fileType;
  fields.naturalWidth.value = `${image.naturalWidth} px`;
  fields.naturalHeight.value = `${image.naturalHeight} px`;
  fields.aspect.value = getAspectRatio(image.naturalWidth, image.naturalHeight);
};
