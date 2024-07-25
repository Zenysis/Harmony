// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import Button from 'components/ui/Button';
import CustomCalculationsModal from 'components/common/CustomCalculationsModal';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import autobind from 'decorators/autobind';
import type Field from 'models/core/wip/Field';
import type QueryResultSpec from 'models/core/QueryResultSpec';

type DefaultProps = {
  iconClassName: string,
  isDisabled: boolean,
  onOpenClick?: () => void,
};

type Props = {
  ...DefaultProps,
  className: string,
  labelClassName: string,
  onQueryResultSpecChange: QueryResultSpec => void,
  queryResultSpec: QueryResultSpec | void,
  selectedFields: Zen.Array<Field>,
  showLabel: boolean,
};

type State = {
  showModal: boolean,
};

export default class CustomCalculationsButton extends React.PureComponent<
  Props,
  State,
> {
  static defaultProps: DefaultProps = {
    iconClassName: '',
    isDisabled: false,
    onOpenClick: undefined,
  };

  state: State = {
    showModal: false,
  };

  @autobind
  onOpenModal() {
    this.setState({ showModal: true });
    if (this.props.onOpenClick) {
      this.props.onOpenClick();
    }
  }

  @autobind
  onRequestCloseModal() {
    this.setState({ showModal: false });
  }

  maybeRenderCustomCalculationsModal(): React.Node {
    const {
      onQueryResultSpecChange,
      queryResultSpec,
      selectedFields,
    } = this.props;
    if (!this.state.showModal || queryResultSpec === undefined) {
      return null;
    }

    // NOTE: Use the first viz as the sample SeriesSettings to pass
    // to CustomCalculationsModal.
    // TODO: Should this stay in sync with the currently
    // selected viz?
    const seriesSettings = queryResultSpec.getSeriesSettings(
      queryResultSpec.viewTypes()[0],
    );
    return (
      <CustomCalculationsModal
        customFields={queryResultSpec.customFields()}
        onQueryResultSpecChange={onQueryResultSpecChange}
        onRequestClose={this.onRequestCloseModal}
        queryResultSpec={queryResultSpec}
        selectedFields={selectedFields}
        seriesSettings={seriesSettings}
        show={this.state.showModal}
      />
    );
  }

  render(): React.Node {
    const label = this.props.showLabel ? (
      <span className={this.props.labelClassName}>
        <I18N>Calculations</I18N>
      </span>
    ) : null;

    return (
      <React.Fragment>
        <Button.Unstyled
          ariaName={I18N.text('Custom Calculations')}
          className={this.props.className}
          dataContent={I18N.textById('Custom Calculations')}
          disabled={this.props.isDisabled}
          onClick={this.onOpenModal}
          testId="aqt-custom-calculations-button"
        >
          <Icon className={this.props.iconClassName} type="wrench" />
          {label}
        </Button.Unstyled>
        {this.maybeRenderCustomCalculationsModal()}
      </React.Fragment>
    );
  }
}
