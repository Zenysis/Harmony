// @flow
import * as React from 'react';

import Tag from 'components/ui/Tag';

type Props = {
  onSymbolClick: (
    value: string,
    event: SyntheticMouseEvent<HTMLDivElement>,
  ) => void,
};

const ButtonTypes = {
  plus: '+',
  minus: '-',
  multiply: '*',
  divide: '/',
  openparen: '(',
  closeparen: ')',
  exponent: '^',
};

const SymbolSVGPaths = {
  plus: ['M11.9,8.4H20v3.5h-8.1V21H8.1v-9.1H0V8.4h8.1V0h3.7V8.4z'],
  minus: ['M19.7,11.8H1.9V8.9h17.9V11.8z'],
  multiply: [
    'M15.8,18.5L4,5.1l2.2-2L18,16.5L15.8,18.5z',
    'M17.4,4.9L5.8,18.6l-2.3-1.9L15.1,3L17.4,4.9z',
  ],
  divide: [
    'M21.3,12.3h-21v-3h21V12.3z',
    'M8.3,2.8c0-0.7,0.2-1.3,0.6-1.8c0.4-0.5,1-0.7,1.9-0.7c0.8,0,1.4,0.2,1.9,0.7c0.4,0.5,0.7,1.1,0.7,1.8s-0.2,1.3-0.7,1.8c-0.4,0.5-1,0.7-1.9,0.7c-0.8,0-1.4-0.2-1.9-0.7C8.5,4.1,8.3,3.5,8.3,2.8z',
    'M8.3,18.8c0-0.7,0.2-1.3,0.6-1.8c0.4-0.5,1-0.7,1.9-0.7c0.8,0,1.4,0.2,1.9,0.7c0.4,0.5,0.7,1.1,0.7,1.8c0,0.7-0.2,1.3-0.7,1.8c-0.4,0.5-1,0.7-1.9,0.7c-0.8,0-1.4-0.2-1.9-0.7C8.5,20.1,8.3,19.5,8.3,18.8z',
  ],
  openparen: [
    'M7.6,10.8c0-1.5,0.2-3,0.6-4.4c0.4-1.4,1.1-2.7,1.9-3.9c0.8-1.2,1.7-2,2.6-2.4l0.4,1.2c-1,0.8-1.9,1.9-2.5,3.5C10,6.3,9.7,8.1,9.6,10l0,0.9c0,2.6,0.5,4.9,1.5,6.8c0.6,1.2,1.3,2.1,2.1,2.7l-0.4,1.2c-0.9-0.5-1.8-1.3-2.7-2.5C8.5,16.7,7.6,14,7.6,10.8z',
  ],
  closeparen: [
    'M15,10.9c0,1.5-0.2,3-0.6,4.4c-0.4,1.4-1,2.7-1.9,3.9c-0.8,1.2-1.7,2-2.7,2.5l-0.4-1.2c1.1-0.8,1.9-2.1,2.6-3.7c0.7-1.7,1-3.6,1-5.6v-0.3c0-1.4-0.2-2.8-0.5-4c-0.3-1.2-0.7-2.3-1.3-3.3c-0.5-1-1.2-1.7-1.9-2.3L9.8,0c0.9,0.5,1.8,1.3,2.6,2.5c0.8,1.2,1.5,2.4,1.9,3.9C14.8,7.8,15,9.3,15,10.9z',
  ],
  exponent: ['M11,8.4L7.9,17H5l5-13h2.1L17,17h-2.8L11,8.4z'],
};

export default class CalculatorPanel extends React.PureComponent<Props> {
  render(): React.Node {
    return (
      <div className="custom-calculations-calculator">
        {Object.keys(ButtonTypes).map(key => (
          <Tag
            className="custom-calculations-calculator__symbol-button"
            value={ButtonTypes[key]}
            onClick={this.props.onSymbolClick}
            intent={Tag.Intents.PRIMARY}
            key={key}
          >
            <svg viewBox="0 0 21.6 21.6">
              {SymbolSVGPaths[key].map((p: string, idx: number) => (
                <path
                  className="custom-calculations-calculator__icon"
                  d={p}
                  // SymbolSVGPaths is a constant, so we don't have to worry
                  // about idx referring to the wrong number
                  // eslint-disable-next-line
                  key={idx}
                />
              ))}
            </svg>
          </Tag>
        ))}
      </div>
    );
  }
}
