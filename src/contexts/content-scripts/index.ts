import { SPINNER } from '@/contexts/content-scripts/assets';
import { renderImageController } from '@/contexts/content-scripts/components/image-controller';
import { renderImageInfo } from '@/contexts/content-scripts/components/image-info';
import { renderImageListSection } from '@/contexts/content-scripts/components/image-list-section';
import {
  onCanvasWheel,
  onMessage,
  onContextmenu,
  onWindowResize,
} from '@/contexts/content-scripts/handlers';
import { buildDetails, buildStyleElement } from '@/contexts/content-scripts/renderers';
import { CONTENT_UI } from '@/contexts/content-scripts/ui';

const { imageViewer, dialog, canvas } = CONTENT_UI;

canvas.addEventListener('wheel', onCanvasWheel);

const { element: detailsElement, closeBtnForPortrait } = buildDetails();

renderImageInfo(detailsElement);
renderImageController(detailsElement);
renderImageListSection(detailsElement);

const style = buildStyleElement();
const shadowRoot = imageViewer.attachShadow({ mode: 'closed' });

dialog.append(canvas);
dialog.append(closeBtnForPortrait);
dialog.append(detailsElement);
canvas.insertAdjacentHTML('afterend', SPINNER);
shadowRoot.appendChild(style);
shadowRoot.appendChild(dialog);
document.body.appendChild(imageViewer);

window.addEventListener('load', () => {
  // for front-end frameworks
  if (!document.body.contains(imageViewer)) {
    document.body.appendChild(imageViewer);
  }
});

window.addEventListener('resize', onWindowResize);

chrome.runtime.onMessage.addListener(onMessage);

window.addEventListener('contextmenu', onContextmenu);
