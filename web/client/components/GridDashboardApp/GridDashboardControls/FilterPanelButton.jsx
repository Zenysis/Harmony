// @flow
import * as React from 'react';

import BootstrapSelect from 'components/bootstrap_select';
import autobind from 'decorators/autobind';
import type FilterPanelSettings from 'models/core/Dashboard/DashboardSpecification/FilterPanelSettings';

const TEXT = t('dashboard_builder');

function getSelectOptions(options: $ReadOnlyArray<string>) {
  return options.map(option => (
    <option value={option} key={option}>
      {TEXT.dashboard_filter.filter_options[option]}
    </option>
  ));
}

type Props = {
  filterPanelSettings: FilterPanelSettings,

  onChangeSelectedOptions: (initialSelectedComponents: Array<string>) => void,
  selectedComponents: $ReadOnlyArray<string>,
};

export default class FilterPanelButton extends React.PureComponent<Props> {
  @autobind
  onChangeSelectedOptions(event: SyntheticEvent<*>) {
    const newSelectedOptions = $(event.target).val() || [];
    this.props.onChangeSelectedOptions(newSelectedOptions);
  }

  renderDashboardFilterButton() {
    // TODO(moriah, pablo): replace this with our internal
    // Dropdown component once multiselect support is added to it
    // TODO(nina): $ConsolidateButtons - change this CSS to reflect
    // design refresh
    const { filterPanelSettings, selectedComponents } = this.props;
    const enabledOptions = filterPanelSettings.filterPanelComponents();
    const selectableOptions = getSelectOptions(enabledOptions.arrayView());

    return (
      <span className="filter-panel-dropdown">
        <BootstrapSelect
          onChange={this.onChangeSelectedOptions}
          title={TEXT.dashboard_filter.button}
          value={selectedComponents}
          className="selectpicker"
          icon="glyphicon-filter"
          multiple
        >
          {selectableOptions}
        </BootstrapSelect>
      </span>
    );
  }

  render() {
    return (
      <span className="filter-panel filter-panel-open">
        {this.renderDashboardFilterButton()}
      </span>
    );
  }
}
