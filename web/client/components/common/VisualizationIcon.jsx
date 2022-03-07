// @flow
import * as React from 'react';
import classNames from 'classnames';

import Icon from 'components/ui/Icon';
import { VISUALIZATION_INFO } from 'models/AdvancedQueryApp/VisualizationType/registry';
import type { VisualizationType } from 'models/AdvancedQueryApp/VisualizationType/types';

type Props = {
  type: VisualizationType,

  className?: string,

  // Should the icon be shown in an enabled or disabled state.
  disabled?: boolean,

  // Should the icon be shown only as an outline with no shading present.
  outline?: boolean,
};

export default function VisualizationIcon({
  type,
  className = '',
  disabled = false,
  outline = false,
}: Props): React.Element<typeof Icon> {
  const fullClassName = classNames('visualization-icon', className, {
    'visualization-icon--disabled': disabled,
    'visualization-icon--outline': disabled || outline,
  });
  const visualizationInfo = VISUALIZATION_INFO[type];
  return (
    <Icon
      className={fullClassName}
      style={visualizationInfo.iconStyle}
      type={visualizationInfo.icon}
    />
  );
}
