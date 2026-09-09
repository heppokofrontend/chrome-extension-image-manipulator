/**
 * 疑似画像要素(background-imageで画像を表示する<img>以外の要素) → 変換後の合成<img> の正引きキャッシュ。
 * 同じ要素に対する再変換を避けるメモ化として使う。
 */
export const convertedDummyMap: Map<HTMLElement, HTMLImageElement> = new Map();
/**
 * 合成<img> → 元の疑似画像要素 の逆引き。表示中の合成<img>から元DOM要素を辿って操作を反映する時に使う。
 */
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
