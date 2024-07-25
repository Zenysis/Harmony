// @flow
import * as React from 'react';

type Props = {
  onClick: (value: string) => void,
  symbol: string,
};

function UnicodeSymbolButton({ onClick, symbol }: Props) {
  return (
    <div onClick={() => onClick(symbol)} role="button">
      <span role="img">{symbol}</span>
    </div>
  );
}

export default (React.memo<Props>(
  UnicodeSymbolButton,
): React.AbstractComponent<Props>);
