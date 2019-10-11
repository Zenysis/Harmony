// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import BaseModal from 'components/ui/BaseModal';
import Button from 'components/ui/Button';
import CustomField from 'models/core/Field/CustomField';
import Field from 'models/core/Field';
import Icon from 'components/ui/Icon';
import IndicatorDropdown from 'components/QueryResult/QueryResultActionButtons/FilterColorModal/IndicatorDropdown';
import LegacyQueryResultData from 'components/visualizations/common/legacy/models/LegacyQueryResultData';
import ProgressBar from 'components/ui/ProgressBar';
import Query from 'components/visualizations/common/legacy/Query';
import RuleContainer from 'components/QueryResult/QueryResultActionButtons/FilterColorModal/RuleContainer';
import autobind from 'decorators/autobind';
import calculateUsedOptions from 'components/QueryResult/QueryResultActionButtons/FilterColorModal/calculateUsedOptions';
import memoizeOne from 'decorators/memoizeOne';
import {
  COLOR_ACTIONS,
  REMOVE_ACTIONS,
} from 'components/QueryResult/QueryResultActionButtons/FilterColorModal/constants';
import { IS_DESIGN_REFRESH } from 'components/AdvancedQueryApp/constants';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import { range, sortNumeric } from 'util/util';
import type SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import type {
  FieldFilterSelections,
  FieldFilterSelectionsMap,
} from 'components/QueryResult/QueryResultActionButtons/FilterColorModal/types';

type RemoveFilters = {
  removeZeroes?: boolean,
  removeNulls?: boolean,
  removeMin?: number,
  removeMax?: number,
};

type SingleColorFilter<V> = {
  value: V,
  color: string,
};

type MultiColorFilter = {
  rangeColors: Array<string>,
  rangeTitle: Array<string>,
  rangeVals: Array<[string, string]>,
};

type ColorFilters = {
  colorTop?: SingleColorFilter<number>,
  colorAbove?: SingleColorFilter<number>,
  colorBottom?: SingleColorFilter<number>,
  colorBelow?: SingleColorFilter<number>,
  colorAboveAverage?: SingleColorFilter<number>,
  colorBelowAverage?: SingleColorFilter<number>,
  colorEqual?: SingleColorFilter<null>,
  colorRangeProps?: MultiColorFilter,
};

// The actual constructed filters (not the modal selections, which
// are represented in FieldFilterSelectionsMap). We construct
// SelectedFilters from the FieldFilterSelectionsMap (the modal selections)
type SelectedFilters = {
  [fieldId: string]: {
    colorFilters: ColorFilters,
    ...$Exact<RemoveFilters>,
  },
};

const TEXT = t('query_form.filters');

function _mean(vals: Array<number>): number {
  let total = 0;
  for (let i = 0; i < vals.length; i += 1) {
    total += vals[i];
  }
  return total / vals.length;
}

type Props = {
  show: boolean,
  customFields: $ReadOnlyArray<CustomField>,
  fields: $ReadOnlyArray<Field | CustomField>,
  onFiltersChange: (
    selectionFilters: {},
    optionsSelected: FieldFilterSelectionsMap,
  ) => void,
  onRequestClose: () => void,
  initialOptionsSelected: FieldFilterSelectionsMap,

  selections?: Zen.Serialized<SimpleQuerySelections>,
};

type State = {
  optionsSelected: FieldFilterSelectionsMap,
  selectedFieldId: string,
  loading: boolean,
  queryResult: LegacyQueryResultData,
  prevFields: $ReadOnlyArray<Field | CustomField>,
};

export default class FilterColorModal extends React.Component<Props, State> {
  static defaultProps = {
    selections: undefined,
  };

  // TODO(pablo): ideally this shouldn't be necessary if the QueryResultSpec
  // were to handle updating the modalFilters when the fields change
  static getDerivedStateFromProps(props: Props, state: State) {
    if (state.prevFields !== props.fields) {
      const { optionsSelected } = state;
      const newOptionsSelected = { ...optionsSelected };

      // TODO(pablo): we are not handling the possibility that fields can be
      // removed. So far this is not possible anywhere, but when this
      // functionality is added to Custom Calculations, we will need to update
      // this logic.
      props.fields.forEach(field => {
        // adds each field into the newOptionsSelected map if it doesn't
        // already exist
        if (!newOptionsSelected[field.id()]) {
          newOptionsSelected[field.id()] = { numRangeOptionsInputs: 1 };
        }
      });

      return {
        optionsSelected: newOptionsSelected,
        prevFields: props.fields,
      };
    }
    return null;
  }

  state = {
    optionsSelected: this.props.initialOptionsSelected,
    selectedFieldId: this.props.fields[0].id(),
    loading: true,
    queryResult: LegacyQueryResultData.create({}),
    prevFields: [],
  };

  _queryPromise: Promise<void>;

  componentDidMount() {
    // Update the stored result data when the modal opens.
    // HACK(stephen): Filtering needs to be heavily refactored. Right now it
    // relies on the GTA result data to filter ALL visualizations.
    this.fetchData();
  }

  componentDidUpdate(prevProps: Props) {
    const currentCustomFields = this.props.customFields;
    if (prevProps.customFields !== currentCustomFields) {
      // TODO(pablo): clean this up. This is a very hacky way of adding
      // custom calculations support to Filters. But this whole component
      // needs to be desperately refactored. QueryResult is being received
      // through both props *and* state. The only way to ensure custom
      // fields are taken into account is to intercept the prop update here
      // and apply the custom fields.
      VENDOR_SCRIPTS.jsInterpreter.load().then(() => {
        this.setState(({ loading, queryResult }) => {
          if (currentCustomFields.length > 0 && !loading) {
            return {
              queryResult: queryResult.applyCustomFields(currentCustomFields),
            };
          }
          return undefined;
        });
      });
    }
  }

  componentWillUnmount() {
    // Cancel any outstanding promises
    if (this._queryPromise && this._queryPromise.isPending()) {
      this._queryPromise.cancel();
    }
  }

  // TODO(stephen): The Filter component will need to be significantly
  // refactored as we move to per visualization querying. The basic concept
  // of a filter will be different for each chart, so having a dependency
  // here on the queried data will not work going forward. For now, this
  // component will kick off a legacy query and use that to power filtering.
  fetchData(): void {
    const { selections } = this.props;

    // TODO(pablo): fetching data should just never be necessary at all once
    // we fully switch over to the new filter/color models
    if (selections !== undefined) {
      // Run the query and store the promise so that we can
      // clean it up later if needed
      this._queryPromise = new Query()
        .buildRequest(selections)
        .run()
        .then(result => {
          const { customFields } = this.props;
          let queryResultData = LegacyQueryResultData.create(result);
          if (customFields.length > 0) {
            queryResultData = queryResultData.applyCustomFields(customFields);
          }
          this.setState({
            queryResult: queryResultData,
            loading: false,
          });
        })
        .catch(failure => console.log(failure));

      // Start the loader to soothe the user's worries
      this.setState({
        loading: true,
      });
      return;
    }
    this.setState({ loading: false });
  }

  /**
   * Get all the field IDs mapped to a sorted array of its values (to make it
   * easy to do computations such as quartiles)
   */
  @memoizeOne
  buildSortedFieldVals(
    queryResult: LegacyQueryResultData,
    fields: $ReadOnlyArray<Field>,
  ): { [fieldId: string]: Array<number> } {
    const fieldIds = Field.pullIds(fields);
    const fieldsSortedMap = {};
    const series = queryResult.series();

    // Removes only undefined values.
    // Sorts by ascending.
    fieldIds.forEach(fieldId => {
      fieldsSortedMap[fieldId] = series
        .map(geoObj => geoObj[`yValue_${fieldId}`])
        .filter(e => e !== undefined)
        .sort((a, b) => sortNumeric(a, b, false));
    });
    return fieldsSortedMap;
  }

  getSortedFieldVals(): { [fieldId: string]: Array<number> } {
    return this.buildSortedFieldVals(this.state.queryResult, this.props.fields);
  }

  setColorFilters(fieldId: string): ColorFilters {
    const sortedFieldVals = this.getFilteredValues(fieldId);
    const colorFilters = {};
    const fieldFilter = this.state.optionsSelected[fieldId];
    const mean = _mean(sortedFieldVals);

    const sortedFieldLength = sortedFieldVals.length;
    Object.keys(fieldFilter).forEach(filter => {
      const filterIdx = Number(filter);

      // TODO(pablo): FieldFilterSelections is a weird type that mixes both
      // indices and non-indices. Right now we want to look at only the
      // indices. This should be refactored to a more conventional
      // representation.
      if (!Number.isNaN(filterIdx)) {
        const filterSelection = fieldFilter[filterIdx];
        const { actionOption, actionColor, actionValue } = filterSelection;

        if (actionOption && actionOption in COLOR_ACTIONS) {
          if (actionColor) {
            if (actionValue) {
              if (actionOption === 'color_top') {
                colorFilters.colorTop = {
                  value:
                    sortedFieldVals[sortedFieldLength - Number(actionValue)],
                  color: actionColor,
                };
              } else if (actionOption === 'color_above') {
                colorFilters.colorAbove = {
                  value: Number(actionValue),
                  color: actionColor,
                };
              } else if (actionOption === 'color_bottom') {
                colorFilters.colorBottom = {
                  value: sortedFieldVals[Number(actionValue) - 1],
                  color: actionColor,
                };
              } else if (actionOption === 'color_below') {
                colorFilters.colorBelow = {
                  value: Number(actionValue),
                  color: actionColor,
                };
              }
            }
            if (actionOption === 'true') {
              colorFilters.colorAbove = {
                value: 0,
                color: actionColor,
              };
            }
            if (actionOption === 'false') {
              colorFilters.colorBelow = {
                value: 1,
                color: actionColor,
              };
            }
            if (actionOption === 'color_above_average') {
              colorFilters.colorAboveAverage = {
                value: mean,
                color: actionColor,
              };
            }
            if (actionOption === 'color_below_average') {
              colorFilters.colorBelowAverage = {
                value: mean,
                color: actionColor,
              };
            }
            if (actionOption === 'values_equal_to_null') {
              colorFilters.colorEqual = {
                value: null,
                color: actionColor,
              };
            }
          }
          if (
            actionOption === 'preset_ranges' ||
            actionOption === 'custom_ranges'
          ) {
            const fieldsMinRange = fieldFilter.fieldsMinRange || [];
            const fieldsMaxRange = fieldFilter.fieldsMaxRange || [];
            const fieldRangeColor = fieldFilter.fieldRangeColor || [];
            const rangeLabel = fieldFilter.rangeLabel || [];
            colorFilters.colorRangeProps = {
              rangeVals: fieldsMinRange.map((minVal, maxIdx) => [
                minVal,
                fieldsMaxRange[maxIdx],
              ]),
              rangeColors: fieldRangeColor,
              rangeTitle: rangeLabel,
            };
          }
        }
      }
    });
    return colorFilters;
  }

  getRemoveFiltersForField(fieldId: string): RemoveFilters {
    const sortedVals = this.getSortedFieldVals()[fieldId];
    const numVals = sortedVals.length;
    const fieldFilter = this.state.optionsSelected[fieldId];
    const filtersForFieldId = {};
    const mean = _mean(sortedVals);

    Object.keys(fieldFilter).forEach(filter => {
      const filterIdx = Number(filter);

      // TODO(pablo): FieldFilterSelections is a weird type that mixes both
      // indices and non-indices. Right now we want to look at only the
      // indices. This should be refactored to a more conventional
      // representation.
      if (!Number.isNaN(filterIdx)) {
        const filterSelection = fieldFilter[filterIdx];
        const { actionOption, actionValue } = filterSelection;

        // Look at only the remove actions
        if (actionOption && actionOption in REMOVE_ACTIONS) {
          if (actionOption === 'remove_values_equal_to_zero') {
            filtersForFieldId.removeZeroes = true;
          }
          if (actionOption === 'remove_values_equal_to_null') {
            filtersForFieldId.removeNulls = true;
          }
          if (actionOption === 'remove_top' && actionValue !== undefined) {
            filtersForFieldId.removeMax =
              sortedVals[numVals - Number(actionValue) - 1];
          }
          if (actionOption === 'remove_above' && actionValue !== undefined) {
            filtersForFieldId.removeMax = Number(actionValue);
          }
          if (actionOption === 'remove_above_average') {
            filtersForFieldId.removeMax = mean;
          }
          if (actionOption === 'remove_bottom' && actionValue !== undefined) {
            filtersForFieldId.removeMin = sortedVals[Number(actionValue)];
          }
          if (actionOption === 'remove_below' && actionValue !== undefined) {
            filtersForFieldId.removeMin = Number(actionValue);
          }
          if (actionOption === 'remove_below_average') {
            filtersForFieldId.removeMin = mean;
          }
        }
      }
    });
    return filtersForFieldId;
  }

  /**
   * Check if a value passes the global RemoveFilters criteria
   */
  doesValuePassFilters(value: ?number, globalFilters: RemoveFilters): boolean {
    const { removeZeroes, removeMax, removeMin, removeNulls } = globalFilters;
    if (removeZeroes && value === 0) {
      return false;
    }
    if (removeNulls && value == null) {
      return false;
    }
    if (value == null) {
      // if the value is null, but we haven't set removeNulls, then we keep the
      // value
      return true;
    }
    if (
      removeMax !== undefined &&
      removeMin !== undefined &&
      !Number.isNaN(parseFloat(removeMax)) &&
      !Number.isNaN(parseFloat(removeMin))
    ) {
      return value >= removeMin && value <= removeMax;
    }
    if (removeMin !== undefined && !Number.isNaN(parseFloat(removeMin))) {
      return value > removeMin;
    }
    if (removeMax !== undefined && !Number.isNaN(parseFloat(removeMax))) {
      return value < removeMax;
    }
    return false;
  }

  getFilteredValues(field: string): Array<number> {
    /* Restrict series to only the geoObjects that aren't removed by filters.
    Pass through to remove values so coloring can be accurate.
    This loops the original query result series and if any field value
    does not match its filter, then the entire series object is removed
    Example:
    geoObj = {
      field_1: 15.0
      fiield_2: 12345.0
    }
    removeMin = 16

    The entire geoObj will be removed in this case because field_1 does not
    satisfy the removeMin filter.
    */
    const globalFilters = this.getGlobalRemoveFilters();
    const fieldIds = Field.pullIds(this.props.fields);
    const filteredValues = this.state.queryResult
      .series()
      .filter(geoObj =>
        fieldIds.every(fieldId =>
          this.doesValuePassFilters(geoObj[`yValue_${fieldId}`], globalFilters),
        ),
      )
      .map(geoObj => geoObj[`yValue_${field}`])
      .filter(e => e !== undefined)
      .sort((a, b) => sortNumeric(a, b, false));
    return filteredValues;
  }

  /**
   * All series must be kept with the same number of rows. So we need to
   * look at the RemoveFilters for each field, and derive from that what
   * the global RemoveFilters should look like. When the global RemoveFilters
   * are applied, they will result in the minimal set of rows that keeps all
   * series with the same length.
   */
  getGlobalRemoveFilters(): RemoveFilters {
    const globalFilters = {
      removeMin: Number.NEGATIVE_INFINITY,
      removeMax: Number.MAX_VALUE,
      removeZeroes: false,
      removeNulls: false,
    };
    this.props.fields.forEach(field => {
      const fieldId = field.id();
      const filtersForFieldId = this.getRemoveFiltersForField(fieldId);
      const {
        removeZeroes,
        removeMax,
        removeMin,
        removeNulls,
      } = filtersForFieldId;
      if (removeZeroes) {
        globalFilters.removeZeroes = true;
      }
      if (removeNulls) {
        globalFilters.removeNulls = true;
      }
      if (removeMin !== undefined && removeMin > globalFilters.removeMin) {
        globalFilters.removeMin = removeMin;
      }
      if (removeMax !== undefined && removeMax < globalFilters.removeMax) {
        globalFilters.removeMax = removeMax;
      }
    });
    return globalFilters;
  }

  /**
   * When submit is clicked, the selected modal options are converted to a
   * SelectedFilters object.
   * TODO(pablo): this is unnecessary, we shouldn't need to keep track two
   * different representations of filters in our query result spec.
   */
  @autobind
  onSubmitClick(e: SyntheticEvent<HTMLButtonElement>): void {
    e.preventDefault();
    const selectionsFilters: SelectedFilters = {};
    const { optionsSelected } = this.state;

    this.props.fields.forEach(field => {
      const fieldId = field.id();
      if (optionsSelected[fieldId]) {
        selectionsFilters[fieldId] = {
          colorFilters: this.setColorFilters(fieldId),
          ...this.getRemoveFiltersForField(fieldId),
        };
      }
    });

    this.props.onFiltersChange(selectionsFilters, optionsSelected);
    this.props.onRequestClose();
  }

  @autobind
  onFieldFilterSelectionsChange(fieldFilterSelections: FieldFilterSelections) {
    this.setState(prevState => {
      const { selectedFieldId, optionsSelected } = prevState;
      return {
        optionsSelected: {
          ...optionsSelected,
          [selectedFieldId]: fieldFilterSelections,
        },
      };
    });
  }

  @autobind
  onIndicatorChange(fieldSelection: { value: string }) {
    this.setState({
      selectedFieldId: fieldSelection.value,
    });
  }

  @autobind
  onAddRuleClick(e: SyntheticEvent<HTMLButtonElement>): void {
    e.preventDefault();
    this.setState(prevState => {
      const { optionsSelected, selectedFieldId } = prevState;
      const fieldFilterSelections = optionsSelected[selectedFieldId];
      const { numRangeOptionsInputs } = fieldFilterSelections;
      return {
        optionsSelected: {
          ...optionsSelected,
          [selectedFieldId]: {
            ...fieldFilterSelections,
            numRangeOptionsInputs: numRangeOptionsInputs + 1,
          },
        },
      };
    });
  }

  @autobind
  onRemoveRuleClick(e: SyntheticEvent<HTMLButtonElement>): void {
    e.preventDefault();
    this.setState(prevState => {
      const { optionsSelected, selectedFieldId } = prevState;
      const fieldFilterSelections = optionsSelected[selectedFieldId];
      const { numRangeOptionsInputs } = fieldFilterSelections;
      const newFilterSelections = { ...fieldFilterSelections };

      // remove the last rule
      delete newFilterSelections[numRangeOptionsInputs - 1];
      if (numRangeOptionsInputs > 1) {
        newFilterSelections.numRangeOptionsInputs -= 1;
      }

      newFilterSelections.usedOptions = calculateUsedOptions(
        newFilterSelections,
      );

      return {
        optionsSelected: {
          ...optionsSelected,
          [selectedFieldId]: newFilterSelections,
        },
      };
    });
  }

  renderAddRemoveButtons() {
    return (
      <React.Fragment>
        <Button outline onClick={this.onAddRuleClick}>
          <Icon type="plus-sign" />
          {TEXT.add_rule}
        </Button>
        <Button outline onClick={this.onRemoveRuleClick}>
          <Icon type="minus-sign" />
          {TEXT.remove_rule}
        </Button>
      </React.Fragment>
    );
  }

  renderIndicatorDropdown() {
    return (
      <IndicatorDropdown
        fields={this.props.fields}
        selectedFieldId={this.state.selectedFieldId}
        onIndicatorChange={this.onIndicatorChange}
      />
    );
  }

  renderRules() {
    const { optionsSelected, selectedFieldId } = this.state;
    const fieldFilterSelections = optionsSelected[selectedFieldId];
    return range(fieldFilterSelections.numRangeOptionsInputs).map(idx => (
      <RuleContainer
        key={idx}
        ruleIdx={idx}
        rule={fieldFilterSelections[idx]}
        fieldFilterSelections={fieldFilterSelections}
        onFieldFilterSelectionsChange={this.onFieldFilterSelectionsChange}
        fieldValues={this.getFilteredValues(selectedFieldId)}
      />
    ));
  }

  renderModalContents(): React.Element<typeof ProgressBar | 'div'> {
    // TODO(nina): $ConsolidateButtons - put back when this stops
    // infinitely loading
    if (this.state.loading && !IS_DESIGN_REFRESH) {
      return <ProgressBar enabled />;
    }

    return (
      <div>
        <p>{TEXT.subtitle}</p>
        {this.renderIndicatorDropdown()}
        <form className="modal-contents">{this.renderRules()}</form>
      </div>
    );
  }

  render() {
    return (
      <BaseModal
        show={this.props.show}
        onRequestClose={this.props.onRequestClose}
        title={TEXT.filter_slice_data_title}
        defaultHeight="80%"
        defaultPercentTop={5}
        width={Infinity}
        onPrimaryAction={this.onSubmitClick}
        closeButtonText={TEXT.cancel_title}
        primaryButtonText={TEXT.apply_title}
        contentAfterActionButtons={this.renderAddRemoveButtons()}
      >
        <div className="filter-slice-modal">{this.renderModalContents()}</div>
      </BaseModal>
    );
  }
}
