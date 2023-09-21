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
  isDisabled?: boolean,
  queryResultSpec: QueryResultSpec | void,
  querySelections: QuerySelections,
  smallMode?: boolean,
  viewType: ResultViewType,
};

function ShareQueryButton({
  isDisabled = false,
  queryResultSpec,
  querySelections,
  smallMode = false,
  viewType,
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
  };

  const size = smallMode ? Button.Sizes.SMALL : Button.Sizes.MEDIUM;

  return (
    <div className="aqt-query-result-action-buttons__secondary-buttons--button">
      <Button
        disabled={isDisabled}
        intent={Button.Intents.PRIMARY}
        onClick={onShareButtonClick}
        size={size}
        testId="download-query-results"
      >
        <Icon type="share" /> <I18N id="share">Share</I18N>
      </Button>
      <ShareQueryModal
        onRequestClose={closeModal}
        queryResultSpec={queryResultSpec}
        querySelections={querySelections}
        show={showModal}
        viewType={viewType}
        visualizationType={displayedVisualizationType}
      />
    </div>
  );
}

export default (React.memo(ShareQueryButton): React.AbstractComponent<Props>);
