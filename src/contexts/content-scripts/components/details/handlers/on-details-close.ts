import { CONTENT_UI } from '@/contexts/content-scripts/ui';

const { dialog } = CONTENT_UI;

export const onDetailsClose = () => {
  dialog.close();
};
