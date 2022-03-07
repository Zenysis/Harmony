// @flow
import type { SpacingT, SpacingUnit } from 'components/ui/Group';
import type { StyleObject } from 'types/jsCore';

type SpacingInfo = {
  margin?: SpacingT,
  marginBottom?: SpacingT,
  marginLeft?: SpacingT,
  marginRight?: SpacingT,
  marginTop?: SpacingT,
  marginUnit: SpacingUnit,
  marginX?: SpacingT,
  marginY?: SpacingT,
  padding?: SpacingT,
  paddingBottom?: SpacingT,
  paddingLeft?: SpacingT,
  paddingRight?: SpacingT,
  paddingTop?: SpacingT,
  paddingUnit: SpacingUnit,
  paddingX?: SpacingT,
  paddingY?: SpacingT,
};

// NOTE(pablo): These variables (and SIZES_EM) match the spacing variables from
// `_zen_variables.scss`. The variables defined in CSS are the source of truth.
const SIZES_PX = Object.freeze({
  none: '0px',
  xxxs: '2px',
  xxs: '4px',
  xs: '8px',
  s: '12px',
  m: '16px',
  l: '24px',
  xl: '36px',
  xxl: '48px',
  xxxl: '64px',
});

const SIZES_EM = Object.freeze({
  none: '0em',
  xxxs: '0.125em',
  xxs: '0.25em',
  xs: '0.5em',
  s: '0.75em',
  m: '1em',
  l: '1.5em',
  xl: '2.25em',
  xxl: '3em',
  xxxl: '4em',
});

const SIZE_MAPS = Object.freeze({
  px: SIZES_PX,
  em: SIZES_EM,
});

function getExactSize(unit: SpacingUnit, size: SpacingT | void): string | void {
  if (size === undefined) {
    return undefined;
  }
  return SIZE_MAPS[unit][size];
}

/**
 * Takes an object of spacing info and generates a style object for the exact
 * values to use for margins and paddings.
 * @returns {StyleObject}
 */
export default function useSpacingClassNames({
  marginUnit,
  paddingUnit,
  margin = undefined,
  marginBottom = undefined,
  marginLeft = undefined,
  marginRight = undefined,
  marginTop = undefined,
  marginX = undefined,
  marginY = undefined,
  padding = undefined,
  paddingBottom = undefined,
  paddingLeft = undefined,
  paddingRight = undefined,
  paddingTop = undefined,
  paddingX = undefined,
  paddingY = undefined,
}: SpacingInfo): StyleObject {
  return {
    marginBottom: getExactSize(marginUnit, marginBottom || marginY || margin),
    marginLeft: getExactSize(marginUnit, marginLeft || marginX || margin),
    marginRight: getExactSize(marginUnit, marginRight || marginX || margin),
    marginTop: getExactSize(marginUnit, marginTop || marginY || margin),
    paddingBottom: getExactSize(
      paddingUnit,
      paddingBottom || paddingY || padding,
    ),
    paddingLeft: getExactSize(paddingUnit, paddingLeft || paddingX || padding),
    paddingRight: getExactSize(
      paddingUnit,
      paddingRight || paddingX || padding,
    ),
    paddingTop: getExactSize(paddingUnit, paddingTop || paddingY || padding),
  };
}
