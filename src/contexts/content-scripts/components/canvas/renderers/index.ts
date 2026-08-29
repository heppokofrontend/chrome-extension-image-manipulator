export const buildCanvas = () => {
  const outer = document.createElement('div');
  const inner = document.createElement('div');
  const moveState = {
    clientY: 0,
    clientX: 0,
    startY: 0,
    startX: 0,
  };
  const moveHandler = (e: MouseEvent) => {
    outer.scroll({
      top: moveState.startY + moveState.clientY - e.clientY,
      left: moveState.startX + moveState.clientX - e.clientX,
    });
  };

  outer.addEventListener('mousedown', (e) => {
    if (e.button !== 0) {
      return;
    }

    e.preventDefault();

    moveState.clientY = e.clientY;
    moveState.clientX = e.clientX;
    moveState.startX = outer.scrollLeft;
    moveState.startY = outer.scrollTop;
    window.addEventListener('mousemove', moveHandler);
  });

  window.addEventListener('mouseup', () => {
    window.removeEventListener('mousemove', moveHandler);
  });

  window.addEventListener('mouseleave', () => {
    window.removeEventListener('mousemove', moveHandler);
  });

  outer.id = 'canvas';
  inner.id = 'canvas-inner';
  outer.append(inner);

  return {
    canvas: outer,
    spaceElement: inner,
  };
};
