import { renderImageList } from '@/contexts/content-scripts/components/image-list/renderers';
import { collectImageListEntries } from '@/contexts/content-scripts/components/image-list/utils';
import { IMAGE_LIST_GAP } from '@/contexts/content-scripts/constants';
import { CONTENT_UI } from '@/contexts/content-scripts/ui';

// scrollIntoView() だと常に上辺か下辺に張り付くため、自前で実装
const scheduleScrollAdjustment = (imageList: HTMLElement, current: HTMLElement | undefined) => {
  if (!current) {
    return;
  }

  current.focus({
    preventScroll: true,
  });

  const imageListRect = imageList.getBoundingClientRect();
  const targetRect = current.getBoundingClientRect();
  const scrollDelta = (() => {
    const isOverflowingTop = targetRect.top < imageListRect.top - IMAGE_LIST_GAP;
    const isOverflowingBottom = imageListRect.bottom < targetRect.top + IMAGE_LIST_GAP;

    if (isOverflowingTop) {
      return targetRect.top - imageListRect.top - IMAGE_LIST_GAP;
    }

    if (isOverflowingBottom) {
      return targetRect.bottom - imageListRect.bottom + IMAGE_LIST_GAP;
    }

    return null;
  })();

  if (scrollDelta === null) {
    return;
  }

  setTimeout(() => {
    imageList.scrollBy(0, scrollDelta);
  }, 0);
};

// 新規描画直後の一瞬(高さ再計算やスクロール位置のズレ)を隠すための猶予。連続呼び出し時は
// 前回分をキャンセルしてから予約し直し、古いクロージャが新しいDOMに対して発火するのを防ぐ。
let invisibleTimeoutId: ReturnType<typeof setTimeout> | undefined;

export const applyImageList = (useCache: boolean = false) => {
  const { imageList, imageListInfo } = CONTENT_UI;
  const images = collectImageListEntries(useCache);

  renderImageList(images);

  const buttons = [...imageList.querySelectorAll('button')];
  const current = buttons.find((button) => button.getAttribute('aria-current') === 'true');
  const currentIndex = current ? buttons.indexOf(current) : -1;
  const viewCurrentIndex = () => {
    imageListInfo.textContent = `${currentIndex + 1} / ${buttons.length}`;
  };

  if (useCache) {
    viewCurrentIndex();
    scheduleScrollAdjustment(imageList, current);

    return;
  }

  imageList.classList.add('invisible');

  if (invisibleTimeoutId !== undefined) {
    clearTimeout(invisibleTimeoutId);
  }

  invisibleTimeoutId = setTimeout(() => {
    invisibleTimeoutId = undefined;
    imageList.classList.remove('invisible');
    viewCurrentIndex();
    current?.scrollIntoView(false);
  }, 300);
};
