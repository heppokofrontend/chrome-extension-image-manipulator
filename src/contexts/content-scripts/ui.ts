import { buildCanvas } from '@/contexts/content-scripts/components/canvas/renderers';
import { buildDialogElement } from '@/contexts/content-scripts/renderers';

const { canvas, spaceElement } = buildCanvas();

export const CONTENT_UI = {
  imageViewer: document.createElement('heppokofrontend-imagemanipulator'),
  dialog: buildDialogElement(),
  canvas,
  spaceElement,
};
