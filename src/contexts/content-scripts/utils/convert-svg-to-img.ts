export const convertedSvgMap: Map<SVGElement, HTMLImageElement> = new Map();
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

  const svgData = img.outerHTML;
  pseudoImage.src = 'data:image/svg+xml,' + encodeURIComponent(svgData);
  return pseudoImage;
};
