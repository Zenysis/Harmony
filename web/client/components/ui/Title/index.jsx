// @flow
import * as React from 'react';

import InfoTooltip from 'components/ui/InfoTooltip';

type Props = {|
  title: string,

  className: string,
  titleTooltip?: string,
|};

const defaultProps = {
  className: '',
  titleTooltip: undefined,
};

/**
 * **This component is deprecated. Use the Heading component instead.**
 *
 * This component groups together a title and an optional tooltip.
 * You can also pass a `className` to style them according to their
 * context. For example:
 *  - Modal's headers require a title to have a border-bottom and padding.
 *  - Tab's titles do not have a border-bottom, and do not use padding-top
 *
 * So we pass a `className` to render the titles differently in those cases.
 *
 * @deprecated
 */
export default function Title(props: Props) {
  const { className, title, titleTooltip } = props;
  const tooltip = titleTooltip ? <InfoTooltip text={titleTooltip} /> : null;

  return (
    <div className={`zen-title ${className}`}>
      <div className="zen-title__contents">
        {title}
        {tooltip}
      </div>
    </div>
  );
}

Title.defaultProps = defaultProps;
