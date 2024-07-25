// @flow
export type ChartSize = {
  +height: number,
  +width: number,
};

export type Margin = {
  bottom: number,
  left: number,
  right: number,
  top: number,
};

// Return value of @vx/event localPoint(event).
export type HoverPoint = {
  x: number,
  y: number,
};
