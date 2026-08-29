import { renderImageController } from '@/contexts/content-scripts/components/image-controller';
import { renderImageInfo } from '@/contexts/content-scripts/components/image-info';
import { renderImageListSection } from '@/contexts/content-scripts/components/image-list-section';
import { initCanvas } from '@/contexts/content-scripts/effects';
import { onMessage, onContextmenu, onWindowResize } from '@/contexts/content-scripts/handlers';
import { CONTENT_UI } from '@/contexts/content-scripts/ui';

import { buildDetails } from './build-details';
import { buildStyleElement } from './build-style-element';

export const renderExtension = () => {
  const { imageViewer, dialog, canvas } = CONTENT_UI;

  const { element: detailsElement, closeBtnForPortrait } = buildDetails();

  renderImageInfo(detailsElement);
  renderImageController(detailsElement);
  renderImageListSection(detailsElement);
  dialog.append(canvas);
  initCanvas();

  const style = buildStyleElement();
  const shadowRoot = imageViewer.attachShadow({ mode: 'closed' });

  dialog.append(closeBtnForPortrait);
  dialog.append(detailsElement);
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
};
