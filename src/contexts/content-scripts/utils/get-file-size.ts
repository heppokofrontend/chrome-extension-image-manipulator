import { getMessage } from '@/utils';

export const getFileSize = (
  image: HTMLImageElement,
): Promise<{ fileSize: string; fileType: string }> => {
  return new Promise((resolve) => {
    const isSVG = image.src.startsWith('data:image/svg+xml');

    if (isSVG) {
      const size = new Blob([image.src]).size;

      resolve({
        fileSize: size ? `${size} byte` : getMessage('error_fileSize'),
        fileType: 'image/svg+xml (in HTML)',
      });
      return;
    }

    const { protocol } = new URL(image.src);

    if (protocol === 'file:') {
      const request: GetLocalFileSizeRequest = {
        type: 'get-local-file-size',
        url: image.src,
      };

      void chrome.runtime
        .sendMessage<GetLocalFileSizeRequest, GetLocalFileSizeResponse>(request)
        .then((response) => {
          resolve(
            response.ok
              ? {
                  fileSize: `${response.fileSize} byte`,
                  fileType: response.fileType,
                }
              : {
                  fileSize: getMessage('error_fileSize'),
                  fileType: getMessage('error_fileType'),
                },
          );
        })
        .catch(() => {
          resolve({
            fileSize: getMessage('error_fileSize'),
            fileType: getMessage('error_fileType'),
          });
        });
      return;
    }

    fetch(image.src.replace(protocol, location.protocol), {
      method: 'HEAD',
    })
      .then(({ headers }) => {
        const size = headers.get('Content-Length');
        const type = headers.get('Content-Type');

        resolve({
          fileSize: size ? `${size} byte` : getMessage('error_fileSize'),
          fileType: type ?? getMessage('error_fileType'),
        });
      })
      .catch(() => {
        resolve({
          fileSize: getMessage('error_fileSize'),
          fileType: getMessage('error_fileType'),
        });
      });
  });
};
