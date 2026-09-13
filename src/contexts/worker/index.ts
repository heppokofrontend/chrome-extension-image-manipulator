import {
  registerContextMenuClickListener,
  registerContextMenusListener,
} from '@/contexts/worker/features';
import { onMessage } from '@/contexts/worker/handlers';

registerContextMenusListener();
registerContextMenuClickListener();
chrome.runtime.onMessage.addListener(onMessage);
