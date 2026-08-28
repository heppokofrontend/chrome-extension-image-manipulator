import { setImageData } from '@/contexts/content-scripts/utils/image-data';

export const getFileSize = (image: HTMLImageElement) => {
  return new Promise<void>((done) => {
    const isSVG = image.src.startsWith('data:image/svg+xml');

    if (isSVG) {
      const size = new Blob([image.src]).size;

      setImageData(image, {
        fileSize: size ? `${size} byte` : chrome.i18n.getMessage('error_fileSize'),
        fileType: 'image/svg+xml (in HTML)',
      });

      done();
      return;
    }

    const { protocol } = new URL(image.src);

    fetch(image.src.replace(protocol, location.protocol), { method: 'HEAD' })
      .then(({ headers }) => {
        const size = headers.get('Content-Length');
        const type = headers.get('Content-Type');

        setImageData(image, {
          fileSize: size ? `${size} byte` : chrome.i18n.getMessage('error_fileSize'),
          fileType: type ?? chrome.i18n.getMessage('error_fileType'),
        });
      })
      .catch(() => {
        setImageData(image, {
          fileSize: chrome.i18n.getMessage('error_fileSize'),
          fileType: chrome.i18n.getMessage('error_fileType'),
        });
      })
      .finally(() => {
        done();
      });
  });
};
