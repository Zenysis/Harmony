// @flow
import * as React from 'react';

import FormulaMetadata from 'models/core/Field/CustomField/Formula/FormulaMetadata';
import { uniqueId } from 'util/util';

type Props = {
  metadata: FormulaMetadata,
};

const SVGPaths = {
  INVALID: [
    'M48.8,58.6L4.5,8.7l8.2-7.3L57,51.3L48.8,58.6z',
    'M54.5,8.1L11.4,59L3,51.9L46,1L54.5,8.1z',
  ],
  VALID: [
    'M41.3-0.4l9.5,0l-23,60L18.5,49L41.3-0.4z',
    'M2.5,30.9L12,24l19.9,25l-4.4,10.3L2.5,30.9z',
  ],
};

const Colors = {
  INVALID: '#F15B5C', // Red
  VALID: '#58915F', // Green
};

export default class FormulaValidator extends React.PureComponent<Props> {
  render(): React.Node {
    const isValid = this.props.metadata.isValid();
    const svgPath = isValid ? SVGPaths.VALID : SVGPaths.INVALID;
    const color = isValid ? Colors.VALID : Colors.INVALID;

    return (
      <div className="custom-calculations-validator">
        <svg className="custom-calculations-validator__svg" viewBox="0 0 60 60">
          {svgPath.map(p => (
            <path key={uniqueId()} d={p} style={{ fill: color }} />
          ))}
        </svg>
        <p
          className="custom-calculations-validator__label"
          control="none"
          style={{
            color,
          }}
        >
          {this.props.metadata.validityMessage()}
        </p>
      </div>
    );
  }
}
