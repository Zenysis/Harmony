// @flow
import * as React from 'react';
import classNames from 'classnames';

import QuerySelectionFilter from 'models/core/SimpleQuerySelections/QuerySelectionFilter';
import SelectWithGroups from 'components/select_with_groups';
import autobind from 'decorators/autobind';
import { SELECT_GRANULARITY_BUTTON_ORDER } from 'backend_config';

// If there are more than N choices, show a dropdown instead of toggle buttons.
const SHOW_DROPDOWN_THRESHOLD = 4;

type Props = {
  filters: { [string]: QuerySelectionFilter },
  onUpdate: (dimension: string) => void,
  value: string,

  enabledDimensions: $ReadOnlyArray<string>,
  disabled: boolean,
  displayLabel: boolean,
};

type State = {
  dropdownSelection: string,
};

type OrderedType = {
  defaultValue: string,
  options: Array<string>,
};

export default class SelectGranularity extends React.Component<Props, State> {
  static defaultProps = {
    disabled: false,
    displayLabel: true,
    enabledDimensions: [],
  };

  state = {
    dropdownSelection: this.props.value,
  };

  componentDidUpdate(prevProps: Props) {
    if (
      prevProps.value !== this.props.value &&
      this.props.value !== this.state.dropdownSelection
    ) {
      this.setState({ dropdownSelection: this.props.value });
    }
  }

  getOrderedDimensions(): OrderedType {
    const { enabledDimensions } = this.props;

    if (!enabledDimensions.length) {
      return {
        defaultValue: this.state.dropdownSelection,
        options: SELECT_GRANULARITY_BUTTON_ORDER,
      };
    }

    // Remove options that are not enabled.
    const options = SELECT_GRANULARITY_BUTTON_ORDER.filter(dimension =>
      enabledDimensions.includes(dimension),
    );

    let defaultValue = this.state.dropdownSelection;
    if (!enabledDimensions.includes(defaultValue)) {
      defaultValue = '';
    }

    return {
      defaultValue,
      options,
    };
  }

  onChange(dimension: string) {
    this.props.onUpdate(dimension);
    this.setState({
      dropdownSelection: dimension,
    });
  }

  @autobind
  onSelectChange(selection: { value: string }) {
    this.onChange(selection.value);
  }

  maybeRenderLabel() {
    if (!this.props.displayLabel) {
      return null;
    }
    return (
      <label className="control-label" htmlFor="select-granularity">
        {t('select_granularity.label')}
      </label>
    );
  }

  renderGranularityButtons(): Array<React.Element<'button'>> {
    const { defaultValue, options } = this.getOrderedDimensions();

    const optionLimit = this.props.filters.geography
      ? Object.keys(this.props.filters.geography.criteria()).reduce(
          (min, geography) => {
            const idx = options.indexOf(geography);
            return idx > -1 ? Math.min(min, idx) : min;
          },
          Infinity,
        )
      : options.length;

    return options.slice(0, optionLimit + 1).map((dim: string) => {
      const isActive = defaultValue === dim;
      const classes = classNames({
        btn: true,
        'btn-granularity': isActive,
        'btn-default': !isActive,
        'btn-geo': true,
      });

      return (
        <button
          type="button"
          className={classes}
          key={dim}
          onClick={this.onChange.bind(this, dim)}
          disabled={this.props.disabled}
        >
          {t(`select_granularity.${dim}`)}
        </button>
      );
    });
  }

  renderGranularityDropdown() {
    const { options } = this.getOrderedDimensions();

    const selectOptions = options.map(dim => ({
      label: t(`select_granularity.${dim}`),
      value: dim,
    }));
    return (
      <SelectWithGroups
        name="select-display-by"
        value={this.state.dropdownSelection}
        onChange={this.onSelectChange}
        options={selectOptions}
        clearable={false}
        disabled={this.props.disabled}
      />
    );
  }

  renderGranularitySelector() {
    return SELECT_GRANULARITY_BUTTON_ORDER.length > SHOW_DROPDOWN_THRESHOLD
      ? this.renderGranularityDropdown()
      : this.renderGranularityButtons();
  }

  render() {
    return (
      <div className="form-group">
        {this.maybeRenderLabel()}
        <div>
          <div
            id="drilldown-level-select"
            className="btn-group btn-geo-group"
            role="group"
            aria-label="Display results by"
          >
            {this.renderGranularitySelector()}
          </div>
        </div>
      </div>
    );
  }
}
