// @flow

export type OriginPlacement =
  | 'top center'
  | 'top left'
  | 'top right'
  | 'bottom center'
  | 'bottom left'
  | 'bottom right'
  | 'right center'
  | 'left center'
  | 'center';

export type BlurType = 'overlay' | 'document';
export type PopoverContainer = 'default' | 'empty' | 'none';

export type OptionalWindowEdgeThresholds = {
  bottom?: number,
  left?: number,
  right?: number,
  top?: number,
};

export type WindowEdgeThresholds = {
  bottom: number,
  left: number,
  right: number,
  top: number,
};
