// @flow
import * as React from 'react';
import classNames from 'classnames';

import normalizeARIAName from 'components/ui/util/normalizeARIAName';

type Props<T> = {
  ariaName: string | void,
  children: React.Node,
  className: string,
  disabled: boolean,
  id: string,
  name: string,
  onSelect: (
    value: T,
    name: string,
    event: SyntheticMouseEvent<HTMLInputElement>,
  ) => void,
  selected: boolean,
  testId: string | void,
  value: T,
};

export default function RadioItemWrapper<T>({
  ariaName,
  children,
  className,
  disabled,
  id,
  name,
  onSelect,
  selected,
  testId,
  value,
}: Props<T>): React.Element<'label'> {
  const onItemClick = (event: SyntheticMouseEvent<HTMLInputElement>) => {
    onSelect(value, name, event);
  };

  // if no ARIA Name was specified, use the item contents if it's a string
  // or a number
  const ariaNameToUse =
    ariaName ||
    (typeof children === 'string' || typeof children === 'number'
      ? String(children)
      : undefined);

  const radioItemClassName = classNames('zen-radio-item', className, {
    'zen-radio-item--disabled': disabled,
  });

  return (
    <label htmlFor={id} className={radioItemClassName}>
      <input
        aria-label={normalizeARIAName(ariaNameToUse)}
        className="zen-radio-item__input"
        onChange={onItemClick}
        type="radio"
        id={id}
        name={name}
        checked={selected}
        disabled={disabled}
        data-testid={testId}
      />
      {children}
    </label>
  );
}
