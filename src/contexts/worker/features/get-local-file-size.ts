export const getLocalFileSize = async (url: string): Promise<GetLocalFileSizeResponse> => {
  const allowed = await chrome.extension.isAllowedFileSchemeAccess();

  if (allowed) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();

      return {
        ok: true,
        fileSize: blob.size,
        fileType: blob.type,
      };
    } catch {
      return {
        ok: false,
        reason: 'fetch-failed',
      };
    }
  }

  return {
    ok: false,
    reason: 'file-access-disabled',
  };
};
