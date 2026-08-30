import { initImageController } from '@/contexts/content-scripts/components/image-controller';
import { initImageInfo } from '@/contexts/content-scripts/components/image-info';
import { addEventImageListControllers } from '@/contexts/content-scripts/components/image-list';
import { initCanvas } from '@/contexts/content-scripts/effects';
import {
  onMessage,
  onContextmenu,
  onWindowResize,
  onDetailsClose,
  onSearchClick,
} from '@/contexts/content-scripts/handlers';
import { CONTENT_UI } from '@/contexts/content-scripts/ui';

import { buildStyleElement } from './build-style-element';

export const renderExtension = () => {
  const { imageViewer, dialog, closeBtn, closeBtnForPortrait, searchButton } = CONTENT_UI;
  const style = buildStyleElement();
  const shadowRoot = imageViewer.attachShadow({ mode: 'closed' });

  closeBtn.addEventListener('click', onDetailsClose);
  closeBtnForPortrait.addEventListener('click', onDetailsClose);
  searchButton.addEventListener('click', onSearchClick);

  initImageInfo();
  initImageController();
  addEventImageListControllers(CONTENT_UI);
  initCanvas();

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
