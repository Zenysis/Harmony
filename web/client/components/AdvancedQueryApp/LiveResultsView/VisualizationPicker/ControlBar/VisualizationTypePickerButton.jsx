// @flow
import * as React from 'react';
import classNames from 'classnames';

import AQTDispatch from 'components/AdvancedQueryApp/AQTDispatch';
import CompactRequirements from 'components/AdvancedQueryApp/LiveResultsView/VisualizationPicker/ControlBar/CompactRequirements';
import Popover from 'components/ui/Popover';
import VisualizationIcon from 'components/common/VisualizationIcon';
import VisualizationPickerContext from 'components/AdvancedQueryApp/VisualizationPickerContext';
import normalizeARIAName from 'components/ui/util/normalizeARIAName';
import { VISUALIZATION_INFO } from 'models/AdvancedQueryApp/VisualizationType/registry';
import type { VisualizationType } from 'models/AdvancedQueryApp/VisualizationType/types';

type Props = {
  visualizationType: VisualizationType,
};

export default function VisualizationTypePickerButton({
  visualizationType,
}: Props): React.Element<'div'> {
  const [showPopover, setShowPopover] = React.useState(false);
  const dispatch = React.useContext(AQTDispatch);
  const { enabledVisualizationTypes } = React.useContext(
    VisualizationPickerContext,
  );
  const isEnabled = enabledVisualizationTypes.includes(visualizationType);

  const viewTypePickerButtonRef = React.useRef();
  const onMouseOver = () => setShowPopover(true);
  const onMouseOut = () => setShowPopover(false);
  const onClick = () => {
    if (isEnabled) {
      dispatch({
        type: 'VISUALIZATION_TYPE_CHANGE',
        visualizationType,
      });
    }
    analytics.track('Visualization Selected', {
      selectedVisualization: visualizationType,
      didLoad: isEnabled,
      selectionLocation: 'Control Bar',
    });
  };

  const className = classNames('aqt-view-type-picker-btn', {
    'aqt-view-type-picker-btn--disabled': !isEnabled,
  });

  const vizName = VISUALIZATION_INFO[visualizationType].name;

  return (
    <div
      ref={viewTypePickerButtonRef}
      aria-label={normalizeARIAName(vizName)}
      className={className}
      onMouseOver={onMouseOver}
      onFocus={onMouseOver}
      onBlur={onMouseOut}
      onMouseOut={onMouseOut}
      onClick={onClick}
      role="button"
    >
      <VisualizationIcon
        className="aqt-view-type-picker-btn__icon"
        disabled={!isEnabled}
        type={visualizationType}
      />
      <Popover
        anchorElt={viewTypePickerButtonRef.current}
        blurType={Popover.BlurTypes.DOCUMENT}
        isOpen={showPopover}
        className="aqt-view-type-picker-btn-popover"
        anchorOuterSpacing={0}
      >
        <CompactRequirements visualizationType={visualizationType} />
      </Popover>
    </div>
  );
}
