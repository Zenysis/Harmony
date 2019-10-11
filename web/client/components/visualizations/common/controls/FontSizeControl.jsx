// @flow
import * as React from 'react';

import DropdownControl from 'components/visualizations/common/controls/DropdownControl';
import { getFontDropdownOptions } from 'components/visualizations/util/settingsUtil';

type DropdownControlProps = $Diff<
  React.ElementConfig<typeof DropdownControl>,
  { children: any },
>;

type Props = DropdownControlProps & {
  maxFontSize: number,
  minFontSize: number,
};

const defaultProps = {
  ...DropdownControl.defaultProps,
  buttonWidth: 60,
};

export default function FontSizeControl(props: Props) {
  const { minFontSize, maxFontSize, ...passThroughProps } = props;
  const fontOptions = getFontDropdownOptions(minFontSize, maxFontSize);

  return <DropdownControl {...passThroughProps}>{fontOptions}</DropdownControl>;
}

FontSizeControl.defaultProps = defaultProps;
