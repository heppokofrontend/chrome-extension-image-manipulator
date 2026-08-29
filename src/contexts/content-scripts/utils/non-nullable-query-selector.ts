// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- Element.querySelector<T> と同じ、呼び出し側が型を指定するための意図的な戻り値限定ジェネリクス
export const nonNullableQuerySelector = <T extends Element>(
  selector: string,
  root?: ParentNode,
): T => {
  const element = (root ?? document).querySelector<T>(selector);

  if (element === null) {
    throw new Error(`Required element not found for selector: ${selector}`);
  }

  return element;
};
