export const convertedDummyMap: Map<HTMLElement, HTMLImageElement> = new Map();
export const convertedImgToDummyMap: Map<HTMLImageElement, HTMLElement> = new Map();

export const convertDummyElementToImg = (img: HTMLElement) => {
  const pseudo = convertedDummyMap.get(img);

  if (pseudo) {
    return pseudo;
  }

  const element = document.createElement('img');
  const { backgroundImage } = getComputedStyle(img);

  if (backgroundImage === 'none') {
    return null;
  }

  element.src = backgroundImage.replace(/url\("(.*)"\)/, '$1');

  convertedDummyMap.set(img, element);
  convertedImgToDummyMap.set(element, img);
  return element;
};
