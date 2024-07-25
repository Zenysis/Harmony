// @flow
import * as React from 'react';
import classNames from 'classnames';

import AQTDispatch from 'components/AdvancedQueryApp/AQTDispatch';
import VisualizationIcon from 'components/common/VisualizationIcon';
import VisualizationPickerContext from 'components/AdvancedQueryApp/VisualizationPickerContext';
import { VISUALIZATION_INFO } from 'models/AdvancedQueryApp/VisualizationType/registry';
import type { VisualizationType } from 'models/AdvancedQueryApp/VisualizationType/types';

type Props = {
  /**
   * `isEnabled` determines if this visualization has had all its
   * requirements satisfied
   */
  isEnabled: boolean,
  isHovered: boolean,
  isLocked: boolean,
  onVisualizationHover: VisualizationType => void,
  onVisualizationUnhover: () => void,
  visualizationType: VisualizationType,
};

export default function VisualizationOption({
  isEnabled,
  isHovered,
  isLocked,
  onVisualizationHover,
  onVisualizationUnhover,
  visualizationType,
}: Props): React.Element<'div'> {
  const { enabledVisualizationTypes } = React.useContext(
    VisualizationPickerContext,
  );
  const dispatch = React.useContext(AQTDispatch);
  const _onVisualizationHover = () => onVisualizationHover(visualizationType);
  const _onVisualizationUnhover = () => onVisualizationUnhover();

  const onVisualizationClick = () => {
    const visualizationIsEnabled = enabledVisualizationTypes.includes(
      visualizationType,
    );
    // if this visualization is enabled (i.e. all requirements have passed) and
    // we're clicking it, then we should switch immediately to it instead of
    // 'Locking' it
    if (visualizationIsEnabled) {
      dispatch({ visualizationType, type: 'VISUALIZATION_TYPE_CHANGE' });
    } else {
      dispatch({
        type: 'VIZ_PICKER_VISUALIZATION_LOCK',
        visualizationType: isLocked ? undefined : visualizationType,
      });
    }
  };

  const labelClassName = classNames('aqt-explore-view-viz-option__label', {
    'aqt-explore-view-viz-option__label--hovered': isHovered,
    'aqt-explore-view-viz-option__label--locked': isLocked,
  });
  const iconContainerClassName = classNames(
    'aqt-explore-view-viz-option__icon-container',
    {
      'aqt-explore-view-viz-option__icon-container--hovered': isHovered,
      'aqt-explore-view-viz-option__icon-container--locked': isLocked,
    },
  );

  return (
    <div
      key={visualizationType}
      className="aqt-explore-view-viz-option"
      data-testid={`aqt-explore-view-viz-option__${visualizationType}`}
      onBlur={_onVisualizationUnhover}
      onClick={onVisualizationClick}
      onFocus={_onVisualizationHover}
      onMouseOut={_onVisualizationUnhover}
      onMouseOver={_onVisualizationHover}
      role="button"
    >
      <div className={iconContainerClassName}>
        <VisualizationIcon disabled={!isEnabled} type={visualizationType} />
      </div>
      <div className={labelClassName}>
        {VISUALIZATION_INFO[visualizationType].name}
      </div>
    </div>
  );
}
