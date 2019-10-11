// @flow
import * as React from 'react';

import DropdownControl, {
  Option,
} from 'components/visualizations/common/controls/DropdownControl';

type DropdownControlProps = $Diff<
  React.ElementConfig<typeof DropdownControl>,
  { children: mixed },
>;

type Props = DropdownControlProps;

const defaultProps = {
  ...DropdownControl.defaultProps,
};

// Mapping from font display name to font family.
const FONT_OPTIONS = {
  Arial: 'Arial',
  'Sans Sarif': 'Open Sans',
  Serif: 'Times New Roman',
  'Courier New': 'Courier New, monospace',
};

export default function FontFamilyControl(props: Props) {
  const fontFamilyOptions = Object.keys(FONT_OPTIONS).map(displayName => (
    <Option
      key={displayName}
      style={{ fontFamily: FONT_OPTIONS[displayName], fontSize: 16 }}
      value={FONT_OPTIONS[displayName]}
    >
      {displayName}
    </Option>
  ));
  const { value } = props;
  return (
    <DropdownControl {...props} valueStyle={{ fontFamily: value }}>
      {fontFamilyOptions}
    </DropdownControl>
  );
}

FontFamilyControl.defaultProps = defaultProps;
