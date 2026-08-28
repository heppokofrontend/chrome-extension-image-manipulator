export type ResolvableElement = HTMLImageElement | SVGElement | HTMLElement;

export type ImageListEntry = {
  src: string;
  alt: string;
  isError: boolean;
  originalElement: SVGElement | HTMLElement;
};
