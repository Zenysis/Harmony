// @flow
import * as React from 'react';

import BaseModal from 'components/ui/BaseModal';
import Control from 'components/visualizations/common/controls/Control';
import Dropdown from 'components/ui/Dropdown';
import I18N from 'lib/I18N';
import Intents from 'components/ui/Intents';
import QueryResultGrouping from 'models/core/QueryResultSpec/QueryResultGrouping';
import useBoolean from 'lib/hooks/useBoolean';
import type { VisualizationControlProps } from 'components/visualizations/common/controls/commonTypes';

// NOTE: The value passed as prop to this is a collection of dimensions
// to pivot a table by. Currently this control only allows selecting a single
// dimension, we plan to make support pivoting by multiple dimensions
type Props = {
  ...VisualizationControlProps<$ReadOnlyArray<string>>,
  dimensions: $ReadOnlyArray<QueryResultGrouping>,
  isUsingCustomTheme: boolean,
  label: string,
  setDefaultTheme: () => void,
};

I18N.text('Indicator', 'field');

const FIELD = 'field';

export default function PivotedDimensionsControl({
  controlKey,
  dimensions,
  isUsingCustomTheme,
  label,
  onValueChange,
  setDefaultTheme,
  value,
}: Props): React.Node {
  const [isModalOpen, showModal, hideModal] = useBoolean(false);

  const onOpenDropdownClick = () => {
    if (isUsingCustomTheme) {
      showModal();
    }
  };

  const onChange = (newVal: $ReadOnlyArray<string>) => {
    // NOTE: Force a selection of a single value at all times,
    // incase the value has been de-selected don't pass anything
    // we will support selecting of multiple dimensions
    const selectedValue = newVal[newVal.length - 1];
    // Only do the warning modal if a new value is selected and the user
    // is using custom themes.
    if (selectedValue) {
      onValueChange(controlKey, [selectedValue]);
    } else {
      onValueChange(controlKey, []);
    }
  };

  const onPrimaryAction = () => {
    setDefaultTheme();
    hideModal();
  };

  const onRequestClose = () => {
    hideModal();
  };

  // NOTE: If we have no dimensions we auto add a dimension grouping of nation
  // that we should not allow users to try and pivot.
  const renderDropdown = () => {
    return (
      <Dropdown.Multiselect
        defaultDisplayContent={I18N.textById('No selection')}
        onOpenDropdownClick={onOpenDropdownClick}
        onSelectionChange={onChange}
        value={value}
      >
        <Dropdown.Option key="field" value={FIELD}>
          <I18N>Indicators</I18N>
        </Dropdown.Option>
        {dimensions
          .filter(dimension => dimension.id() !== 'nation')
          .map(dimension => (
            <Dropdown.Option key={dimension.id()} value={dimension.id()}>
              {dimension.label()}
            </Dropdown.Option>
          ))}
      </Dropdown.Multiselect>
    );
  };

  return (
    <React.Fragment>
      <Control htmlFor={controlKey} label={label}>
        {renderDropdown()}
      </Control>
      <BaseModal
        closeButtonText={I18N.textById('Cancel')}
        onPrimaryAction={onPrimaryAction}
        onRequestClose={onRequestClose}
        overlayClassName="pivot-modal-over-popover-hack"
        primaryButtonIntent={Intents.DANGER}
        primaryButtonText={I18N.textById('Continue')}
        show={isModalOpen}
        title={I18N.text(
          'Custom themes not supported for pivot table',
          'pivot-warning-header',
        )}
        width="auto"
      >
        <p>
          {I18N.text(
            'Custom themes are not supported for pivoted tables. Press continue to pivot, and reset the table theme to the default theme.',
            'pivot-warning-body',
          )}
        </p>
      </BaseModal>
    </React.Fragment>
  );
}
