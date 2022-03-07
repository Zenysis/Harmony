// @flow
export type LegendItem = {
  color: string,
  enabled: boolean,
  id: string,
  label: string,
  shape:
    | 'block'
    | 'line-dash'
    | 'line-dashdot'
    | 'line-dot'
    | 'line-longdash'
    | 'line-longdashdot'
    | 'line-solid',
};
