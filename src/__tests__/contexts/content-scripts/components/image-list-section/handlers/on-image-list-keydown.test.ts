import { afterEach, describe, expect, it, vi } from 'vitest';
import { onImageListKeydown } from '@/contexts/content-scripts/components/image-list-section/handlers/on-image-list-keydown';

// IMAGE_LIST_COLS is 8; grid math below is written against that value
const COLS = 8;

const buildButtons = (count: number) => {
  const ul = document.createElement('ul');
  const clicked: number[] = [];
  const buttons: HTMLButtonElement[] = [];

  for (let i = 0; i < count; i++) {
    const li = document.createElement('li');
    const button = document.createElement('button');

    button.addEventListener('click', () => clicked.push(i));
    li.appendChild(button);
    ul.appendChild(li);
    buttons.push(button);
  }

  document.body.appendChild(ul);

  return { buttons, clicked };
};

const makeEvent = (
  currentTarget: EventTarget,
  key: string,
  modifiers: Partial<Pick<KeyboardEvent, 'altKey' | 'ctrlKey'>> = {},
) => {
  const preventDefault = vi.fn();
  const event = {
    currentTarget,
    key,
    altKey: false,
    ctrlKey: false,
    ...modifiers,
    preventDefault,
  } as unknown as KeyboardEvent;

  return { event, preventDefault };
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('onImageListKeydown', () => {
  it('does nothing when altKey is held', () => {
    const { buttons, clicked } = buildButtons(3);
    const { event, preventDefault } = makeEvent(buttons[0]!, 'ArrowRight', { altKey: true });

    onImageListKeydown(event);

    expect(clicked).toEqual([]);
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('does nothing when ctrlKey is held', () => {
    const { buttons, clicked } = buildButtons(3);
    const { event } = makeEvent(buttons[0]!, 'ArrowRight', { ctrlKey: true });

    onImageListKeydown(event);

    expect(clicked).toEqual([]);
  });

  it('does nothing when currentTarget is not a button', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const { event } = makeEvent(div, 'ArrowRight');
    expect(() => onImageListKeydown(event)).not.toThrow();
  });

  it('does nothing when the button has no ancestor ul', () => {
    const button = document.createElement('button');
    document.body.appendChild(button);

    const { event } = makeEvent(button, 'ArrowRight');
    expect(() => onImageListKeydown(event)).not.toThrow();
  });

  it('ignores keys it does not recognize', () => {
    const { buttons, clicked } = buildButtons(3);
    const { event } = makeEvent(buttons[1]!, 'a');

    onImageListKeydown(event);

    expect(clicked).toEqual([]);
  });

  it('calls preventDefault for Arrow keys but not for Home/End', () => {
    const { buttons } = buildButtons(3);

    const arrow = makeEvent(buttons[0]!, 'ArrowRight');
    onImageListKeydown(arrow.event);
    expect(arrow.preventDefault).toHaveBeenCalledOnce();

    const home = makeEvent(buttons[0]!, 'Home');
    onImageListKeydown(home.event);
    expect(home.preventDefault).not.toHaveBeenCalled();
  });

  it('Home clicks the first button', () => {
    const { buttons, clicked } = buildButtons(5);

    onImageListKeydown(makeEvent(buttons[3]!, 'Home').event);

    expect(clicked).toEqual([0]);
  });

  it('End clicks the last button', () => {
    const { buttons, clicked } = buildButtons(5);

    onImageListKeydown(makeEvent(buttons[1]!, 'End').event);

    expect(clicked).toEqual([4]);
  });

  it('ArrowRight clicks the next button', () => {
    const { buttons, clicked } = buildButtons(5);

    onImageListKeydown(makeEvent(buttons[1]!, 'ArrowRight').event);

    expect(clicked).toEqual([2]);
  });

  it('ArrowRight wraps around to the first button from the last', () => {
    const { buttons, clicked } = buildButtons(5);

    onImageListKeydown(makeEvent(buttons[4]!, 'ArrowRight').event);

    expect(clicked).toEqual([0]);
  });

  it('ArrowLeft clicks the previous button', () => {
    const { buttons, clicked } = buildButtons(5);

    onImageListKeydown(makeEvent(buttons[3]!, 'ArrowLeft').event);

    expect(clicked).toEqual([2]);
  });

  it('ArrowLeft wraps around to the last button from the first', () => {
    const { buttons, clicked } = buildButtons(5);

    onImageListKeydown(makeEvent(buttons[0]!, 'ArrowLeft').event);

    expect(clicked).toEqual([4]);
  });

  it('ArrowDown moves one row down within the grid', () => {
    const { buttons, clicked } = buildButtons(10);

    onImageListKeydown(makeEvent(buttons[0]!, 'ArrowDown').event);

    expect(clicked).toEqual([COLS]);
  });

  it('ArrowDown wraps back to the same column on the first row when there is no row below', () => {
    const { buttons, clicked } = buildButtons(10);

    onImageListKeydown(makeEvent(buttons[8]!, 'ArrowDown').event);

    expect(clicked).toEqual([0]);
  });

  it('ArrowUp moves one row up within the grid', () => {
    const { buttons, clicked } = buildButtons(10);

    onImageListKeydown(makeEvent(buttons[8]!, 'ArrowUp').event);

    expect(clicked).toEqual([0]);
  });

  it('ArrowUp wraps to the matching column on the last row when it exists', () => {
    const { buttons, clicked } = buildButtons(10);

    onImageListKeydown(makeEvent(buttons[0]!, 'ArrowUp').event);

    expect(clicked).toEqual([COLS]);
  });

  it('ArrowUp falls back when the last row has no matching column', () => {
    const { buttons, clicked } = buildButtons(10);

    onImageListKeydown(makeEvent(buttons[2]!, 'ArrowUp').event);

    expect(clicked).toEqual([2]);
  });
});
