import React from 'react';

import Dropdown from 'components/ui/Dropdown';

export function getFontDropdownOptions(startSize, endSize) {
  const options = [];
  for (let i = startSize; i < endSize + 1; i++) {
    const val = `${i}px`;
    options.push(
      <Dropdown.Option key={val} value={val}>
        {i}
      </Dropdown.Option>,
    );
  }
  return options;
}
