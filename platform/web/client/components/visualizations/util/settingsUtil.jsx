// @flow
import * as React from 'react';

import Dropdown from 'components/ui/Dropdown';
import { range } from 'util/arrayUtil';

export function getFontDropdownOptions(
  startSize: number,
  endSize: number,
): $ReadOnlyArray<React.Element<Class<Dropdown.Option<string>>>> {
  return range(startSize, endSize + 1).map(i => {
    const val = `${i}px`;
    return (
      <Dropdown.Option key={val} value={val}>
        {i}
      </Dropdown.Option>
    );
  });
}
