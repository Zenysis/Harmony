// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import CustomField from 'models/core/Field/CustomField';
import FilterColorModal from 'components/QueryResult/QueryResultActionButtons/FilterColorModal';
import Icon from 'components/ui/Icon';
import LegacyField from 'models/core/Field';
import autobind from 'decorators/autobind';
import type SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import type { FieldFilterSelectionsMap } from 'components/QueryResult/QueryResultActionButtons/FilterColorModal/types';

type Props = {
  customFields: $ReadOnlyArray<CustomField>,
  fields: $ReadOnlyArray<LegacyField | CustomField>,
  onFiltersChange: (
    selectionFilters: {},
    modalOptionsSelected: FieldFilterSelectionsMap,
  ) => void,
  modalOptionsSelected: FieldFilterSelectionsMap,
  showLabel: boolean,

  className: string,
  containerClassName: string,
  iconClassName: string,
  labelClassName: string,
  selections?: Zen.Serialized<SimpleQuerySelections>,
};

type State = {
  showModal: boolean,
};

export default class FilterButton extends React.PureComponent<Props, State> {
  static defaultProps = {
    className: 'action-button dashboard-item-button',
    containerClassName: 'query-result-filter-button filter-body',
    iconClassName: '',
    labelClassName: 'action-button-text filter-button-text',
    selections: undefined,
  };

  state = {
    showModal: false,
  };

  @autobind
  onOpenModalClick() {
    this.setState({
      showModal: true,
    });
  }

  @autobind
  onRequestCloseModal() {
    this.setState({
      showModal: false,
    });
  }

  maybeRenderFilterColorModal() {
    const { showModal } = this.state;
    const { customFields, fields, selections, onFiltersChange } = this.props;

    // construct the initial modal selections
    // TODO(pablo): this shouldnt need to be happen here. It should be the
    // QueryResultSpec model's job to initialize everything correctly.
    const initialModalOptions = { ...this.props.modalOptionsSelected };
    this.props.fields.forEach(field => {
      // adds each field into the initialModalOptions map if it doesn't
      // already exist
      if (!initialModalOptions[field.id()]) {
        initialModalOptions[field.id()] = { numRangeOptionsInputs: 1 };
      }
    });

    return (
      <FilterColorModal
        show={showModal}
        onRequestClose={this.onRequestCloseModal}
        customFields={customFields}
        fields={fields}
        selections={selections}
        onFiltersChange={onFiltersChange}
        initialOptionsSelected={initialModalOptions}
      />
    );
  }

  renderButton() {
    const label = this.props.showLabel ? (
      <span className={this.props.labelClassName}>
        {t('query_form.filters.filter_slice_data_title')}
      </span>
    ) : null;

    return (
      <button
        type="button"
        className={this.props.className}
        onClick={this.onOpenModalClick}
        data-content={t('dashboard.DashboardItem.filter')}
      >
        <Icon type="adjust" className={this.props.iconClassName} />
        {label}
      </button>
    );
  }

  render() {
    return (
      <div className={this.props.containerClassName}>
        {this.renderButton()}
        {this.maybeRenderFilterColorModal()}
      </div>
    );
  }
}
