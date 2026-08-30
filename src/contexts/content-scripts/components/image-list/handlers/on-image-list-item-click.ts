import { resolveImageElement } from '@/contexts/content-scripts/components/image-list/utils';
import { showDialog } from '@/contexts/content-scripts/show-dialog';
import { STATE } from '@/contexts/content-scripts/state';

/**
 * ボタン要素 → 対応する画像リストエントリの originalElement の対応表。
 * originalElement はDOM要素の参照でdata属性へ文字列化できないため、on-image-list-keydown.ts と
 * 同様に e.currentTarget だけから状態を復元できるよう、クロージャ捕捉の代わりにこのWeakMapで渡す。
 */
export const imageListItemSourceMap: WeakMap<HTMLButtonElement, SVGElement | HTMLElement> =
  new WeakMap();

export const onImageListItemClick = (e: MouseEvent) => {
  if (!(e.currentTarget instanceof HTMLButtonElement)) {
    return;
  }

  const button = e.currentTarget;
  const originalElement = imageListItemSourceMap.get(button);

  if (!originalElement) {
    return;
  }

  const resolved = resolveImageElement(originalElement);

  // FIXME: resolved が undefined の時 STATE.currentImageElement が前回値のまま残り、
  // 直後の !STATE.currentImageElement ガードを素通りして無関係な前回選択画像でダイアログが開く恐れがある。
  // 現状は convertedSvgMap/convertedDummyMap が .delete() されないので実質到達しないはずだが、
  // 前提が崩れると気付きにくく壊れる。resolved が falsy なら早期 return する形に直すのが本筋。
  if (resolved) {
    STATE.currentImageElement = resolved;
  }

  if (!STATE.currentImageElement) {
    return;
  }

  if (button.getAttribute('aria-current') !== 'true') {
    void showDialog({ noRecreateImageList: true });
  }
};
