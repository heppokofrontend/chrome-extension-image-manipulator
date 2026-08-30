import { onMessage, onContextmenu, onWindowResize } from '@/contexts/content-scripts/handlers';
import { renderExtension } from '@/contexts/content-scripts/renderers';
import { CONTENT_UI } from '@/contexts/content-scripts/ui';

renderExtension();

window.addEventListener('load', () => {
  const { imageViewer } = CONTENT_UI;

  // for front-end frameworks
  if (!document.body.contains(imageViewer)) {
    document.body.appendChild(imageViewer);
  }
});

window.addEventListener('resize', onWindowResize);

chrome.runtime.onMessage.addListener(onMessage);

window.addEventListener('contextmenu', onContextmenu);
