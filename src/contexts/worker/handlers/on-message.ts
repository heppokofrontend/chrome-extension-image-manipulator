import { getLocalFileSize } from '@/contexts/worker/features';

const isGetLocalFileSizeRequest = (message: unknown): message is GetLocalFileSizeRequest =>
  typeof message === 'object' &&
  message !== null &&
  (message as { type?: unknown }).type === 'get-local-file-size';

export const onMessage = (
  message: unknown,
  _: chrome.runtime.MessageSender,
  sendResponse: (response: GetLocalFileSizeResponse) => void,
): boolean => {
  if (isGetLocalFileSizeRequest(message)) {
    void getLocalFileSize(message.url).then(sendResponse);
    return true;
  }

  return false;
};
