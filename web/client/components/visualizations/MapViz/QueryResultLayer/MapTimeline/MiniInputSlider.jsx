// @flow
import * as React from 'react';

type Props = {
  currentIndex: number,
  maxDateIndex: number,

  /** An array of possible range values */
  values: $ReadOnlyArray<string>,

  /** Width of the slider in pixels */
  width: number,
};

function MiniInputSlider({
  currentIndex,
  maxDateIndex,
  values,
  width,
}: Props): React.Element<'div'> {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <svg width={width} height={2}>
        {values.map((value, idx) => {
          const startPosition = (idx / maxDateIndex) * width;
          const endPosition = ((idx + 1) / maxDateIndex) * width;

          let line = null;
          if (idx !== values.length - 1) {
            line = (
              <line
                key={idx}
                x1={startPosition}
                x2={endPosition}
                y1="1.5"
                y2="1.5"
                stroke={idx < currentIndex ? '#313234' : '#bfc2c9'}
              />
            );
          }

          return line;
        })}
      </svg>
    </div>
  );
}

export default (React.memo(MiniInputSlider): React.AbstractComponent<Props>);
