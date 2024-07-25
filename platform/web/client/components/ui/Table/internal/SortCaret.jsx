// @flow
import * as React from 'react';
import classNames from 'classnames';

import Caret from 'components/ui/Caret';

type Props = {
  sortDirection?: 'ASC' | 'DESC',
};

const defaultProps = {
  sortDirection: undefined,
};

export default function SortCaret(props: Props): React.Element<'div'> {
  const { sortDirection } = props;
  const upCaretClassName = classNames(
    'zen-table__sort-caret zen-table__sort-caret-up',
    {
      'zen-table__sort-caret--selected': sortDirection === 'ASC',
    },
  );
  const downCaretClassName = classNames(
    'zen-table__sort-caret zen-table__sort-caret-down',
    {
      'zen-table__sort-caret--selected': sortDirection === 'DESC',
    },
  );

  return (
    <div className="zen-table__sort-caret-container">
      <Caret className={upCaretClassName} direction={Caret.Directions.UP} />
      <Caret className={downCaretClassName} direction={Caret.Directions.DOWN} />
    </div>
  );
}

SortCaret.defaultProps = defaultProps;
