// @flow
import * as React from 'react';

import Button from 'components/ui/Button';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import ShareQueryModal from 'components/common/SharingUtil/ShareQueryModal';
import VisualizationPickerContext from 'components/AdvancedQueryApp/VisualizationPickerContext';
import useBoolean from 'lib/hooks/useBoolean';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

type Props = {
  querySelections: QuerySelections,
  queryResultSpec: QueryResultSpec | void,
  viewType: ResultViewType,

  isDisabled?: boolean,
  smallMode?: boolean,
};

function ShareQueryButton({
  querySelections,
  queryResultSpec,
  viewType,
  isDisabled = false,
  smallMode = false,
}: Props) {
  const { displayedVisualizationType } = React.useContext(
    VisualizationPickerContext,
  );
  const [showModal, openModal, closeModal] = useBoolean(false);

  const onShareButtonClick = () => {
    if (isDisabled) {
      return;
    }
    openModal();
    analytics.track('Click AQT share query button');
  };

  const size = smallMode ? Button.Sizes.SMALL : Button.Sizes.MEDIUM;

  return (
    <div className="aqt-query-result-action-buttons__secondary-buttons--button">
      <Button
        disabled={isDisabled}
        size={size}
        intent={Button.Intents.PRIMARY}
        testId="download-query-results"
        onClick={onShareButtonClick}
      >
        <Icon type="share" /> <I18N id="share">Share</I18N>
      </Button>
      <ShareQueryModal
        show={showModal}
        viewType={viewType}
        visualizationType={displayedVisualizationType}
        onRequestClose={closeModal}
        queryResultSpec={queryResultSpec}
        querySelections={querySelections}
      />
    </div>
  );
}

export default (React.memo(ShareQueryButton): React.AbstractComponent<Props>);
