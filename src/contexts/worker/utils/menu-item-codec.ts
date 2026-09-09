const SCALE_UNIT = '%';
const ROTATE_UNIT = 'deg';

export const formatScaleMenuId = (percent: number): string => `${percent}${SCALE_UNIT}`;
export const formatRotateMenuId = (deg: number): string => `${deg}${ROTATE_UNIT}`;

export const parseScaleMenuId = (id: string): number | null =>
  id.endsWith(SCALE_UNIT) ? parseInt(id, 10) : null;

export const parseRotateMenuId = (id: string): number | null =>
  id.endsWith(ROTATE_UNIT) ? parseInt(id, 10) : null;
