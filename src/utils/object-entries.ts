export const objectEntries = <T extends object>(target: T) =>
  Object.entries(target) as [keyof T, T[keyof T]][];
