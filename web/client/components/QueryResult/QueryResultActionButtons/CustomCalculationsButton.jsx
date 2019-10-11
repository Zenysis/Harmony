// @flow
import * as React from 'react';

import CustomCalculationsModal from 'components/QueryResult/QueryResultActionButtons/CustomCalculationsModal';
import CustomField from 'models/core/Field/CustomField';
import Field from 'models/core/Field';
import Icon from 'components/ui/Icon';
import { autobind, memoizeOne } from 'decorators';

type Props = {
  allFields: $ReadOnlyArray<Field>,
  customFields: $ReadOnlyArray<CustomField>,
  onCalculationSubmit: CustomField => void,
  onEditCalculation: (
    previousField: CustomField,
    editedField: CustomField,
  ) => void,
  onDeleteCalculation: CustomField => void,

  className: string,
  iconClassName: string,
  labelClassName: string,
  containerClassName: string,
  showLabel: boolean,
};

type State = {
  showModal: boolean,
};

const TEXT = t('QueryApp.CustomCalculationsButton');

export default class CustomCalculationsButton extends React.PureComponent<
  Props,
  State,
> {
  static defaultProps = {
    className: 'action-button dashboard-item-button',
    iconClassName: '',
    labelClassName: 'action-button-text',
    containerClassName: 'query-result-custom-calculations-button',
  };

  state = {
    showModal: false,
  };

  @memoizeOne
  buildNonCustomFields(
    allFields: $ReadOnlyArray<Field>,
    customFields: $ReadOnlyArray<CustomField>,
  ): $ReadOnlyArray<Field> {
    const customFieldIds = customFields.map(f => f.id());
    return allFields.filter(f => !customFieldIds.includes(f.id()));
  }

  getNonCustomFields(): $ReadOnlyArray<Field> {
    const { allFields, customFields } = this.props;
    return this.buildNonCustomFields(allFields, customFields);
  }

  @autobind
  onOpenModal() {
    this.setState({ showModal: true });
  }

  @autobind
  onRequestCloseModal() {
    this.setState({ showModal: false });
  }

  maybeRenderCustomCalculationsModal() {
    if (this.state.showModal) {
      return (
        <CustomCalculationsModal
          show={this.state.showModal}
          onRequestClose={this.onRequestCloseModal}
          onCalculationSubmit={this.props.onCalculationSubmit}
          onEditCalculation={this.props.onEditCalculation}
          onDeleteCalculation={this.props.onDeleteCalculation}
          fields={this.getNonCustomFields()}
          customFields={this.props.customFields}
        />
      );
    }
    return null;
  }

  render() {
    const label = this.props.showLabel ? (
      <span className={this.props.labelClassName}>{TEXT.label}</span>
    ) : null;

    // TODO(pablo): refactor this, and the other QueryResultContainer buttons
    // to use our ui/LegacyButton.jsx class
    return (
      <div className={this.props.containerClassName}>
        <button
          type="button"
          className={this.props.className}
          onClick={this.onOpenModal}
          data-content={t('dashboard.DashboardItem.calculations')}
        >
          <Icon type="wrench" className={this.props.iconClassName} />
          {label}
        </button>
        {this.maybeRenderCustomCalculationsModal()}
      </div>
    );
  }
}
