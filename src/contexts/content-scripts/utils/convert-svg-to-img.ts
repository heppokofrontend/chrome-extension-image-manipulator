/**
 * 元のSVG要素 → 変換後の合成<img> の正引きキャッシュ。同じ要素に対する再変換を避けるメモ化として使う。
 */
export const convertedSvgMap: Map<SVGElement, HTMLImageElement> = new Map();
/**
 * 合成<img> → 元のSVG要素 の逆引き。表示中の合成<img>から元DOM要素を辿って操作を反映する時に使う。
 */
export const convertedImgToSVGMap: Map<HTMLImageElement, SVGElement> = new Map();

export const convertSVGToImg = (img: SVGElement) => {
  const pseudoImage = (() => {
    const pseudo = convertedSvgMap.get(img);

    if (pseudo) {
      return pseudo;
    }

    const element = document.createElement('img');
    convertedSvgMap.set(img, element);
    convertedImgToSVGMap.set(element, img);
    return element;
  })();

  img.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  pseudoImage.src = 'data:image/svg+xml,' + encodeURIComponent(img.outerHTML);
  return pseudoImage;
};
