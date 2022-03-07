// @flow
import * as React from 'react';
import classNames from 'classnames';

import { uniqueId } from 'util/util';

type Props<T> = {
  onSelectionChange: (selection: T) => void,
  values: $ReadOnlyArray<T>,
  selectedValue: T,

  renderButtonContents?: (value: T) => React.Node,
};

/**
 * Represents a group of selectable buttons. This is different from the regular
 * ui Button because these buttons are not CTAs. They do not trigger an action.
 * They are more similar to radio buttons or checkboxes, because they represent
 * selections.
 *
 * TODO(pablo): when this is needed in other places we should turn this into a
 * core UI component.
 */
export default function SelectableButtonGroup<T: string>({
  onSelectionChange,
  values,
  selectedValue,
  renderButtonContents = undefined,
}: Props<T>): React.Element<'div'> {
  function renderSingleButton(value: T) {
    const isSelected = value === selectedValue;
    const className = classNames(
      'zen-date-picker-selectable-button-group__selectable-btn',
      {
        'zen-date-picker-selectable-button-group__selectable-btn--selected': isSelected,
      },
    );

    const onChange = () => onSelectionChange(value);
    const btnId = `btn-group-item__${uniqueId()}`;
    return (
      <React.Fragment key={value}>
        <label className={className} htmlFor={btnId}>
          <input
            type="radio"
            className="zen-date-picker-selectable-button-group__radio-item"
            id={btnId}
            onChange={onChange}
            checked={isSelected}
          />
          {renderButtonContents ? renderButtonContents(value) : value}
        </label>
      </React.Fragment>
    );
  }

  return (
    <div className="zen-date-picker-selectable-button-group">
      {values.map(renderSingleButton)}
    </div>
  );
}
