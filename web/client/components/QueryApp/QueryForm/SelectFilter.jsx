// @flow
import * as React from 'react';
import invariant from 'invariant';

import QuerySelectionFilter from 'models/core/SimpleQuerySelections/QuerySelectionFilter';
import { DIMENSION_VALUE_MAP, NATION_NAME } from 'backend_config';
import { autobind, memoizeOne } from 'decorators';
import { pick, omit } from 'util/util';
import type DimensionValue from 'models/core/wip/Dimension/DimensionValue';

// Option value for no filter applied.
const ALL_OPTION_VALUE = '_all';

const LABEL_ALL = t('select_filter.all');
const GEO_FIELD_ORDERING = window.__JSON_FROM_BACKEND.geoFieldOrdering;

type Props = {
  filterDimensions: $ReadOnlyArray<string>,
  onUpdateSelection: (
    filterType: string,
    filter: QuerySelectionFilter | void,
  ) => void,

  disabled: boolean,
  displayLabel: boolean,
  filterType: string,
  useOptGroups: boolean,
  value?: QuerySelectionFilter,
};

type State = {
  initialized: boolean,
};

const NON_SELECTED_TEXT = t('query_form.selections.data_non_selected_text');

// The label for the category this dropdown represents.
const FILTER_CATEGORY_TEXT = t('select_filter.labels');

// The label of the individual groups within the category.
const FILTER_GROUP_TEXT = t('select_filter');

type DimensionObject = {
  dimensionStruct: DimensionValue,
  label: string,
  value: string,
};

type DimensionLevel = {
  childOptions: $ReadOnlyArray<DimensionObject>,
  groupLabel: string,
  label?: string,
};

function buildFilterOptions(
  filterDimensions: $ReadOnlyArray<string>,
): $ReadOnlyArray<DimensionLevel> {
  const ret = [];
  if (filterDimensions === undefined) {
    return ret;
  }

  let allValueOption;
  let childOptionCount = 0;
  filterDimensions.forEach(dimension => {
    if (dimension === ALL_OPTION_VALUE) {
      // Special case for nation. There is no "nation" dimension, so the
      // value is null and GTA treats this as a wildcard..
      allValueOption = { value: null, label: LABEL_ALL };
      return;
    }

    // Create an option for each geo level.
    const childOptions = [];
    DIMENSION_VALUE_MAP[dimension].forEach((dimensionStruct, idx) => {
      // HACK(ian): Remove Nation region option for Ethiopia.
      if (dimensionStruct.RegionName === 'Nation') {
        return;
      }
      childOptions.push({
        value: `${dimension}_${idx}`,
        label: dimensionStruct._display,
        dimensionStruct: omit(dimensionStruct, '_display'),
      });
    });
    const addMe = {
      groupLabel: FILTER_GROUP_TEXT[dimension],
      childOptions,
    };

    childOptionCount += childOptions.length;
    ret.push(addMe);
  });

  // If there is only one child option to be shown, do not include the
  // "all values" option since it would be redundant.
  // NOTE(stephen): Is this actually desired? How would you clear a filter if
  // there is no "all values" option?
  if (childOptionCount <= 1 || allValueOption === undefined) {
    return ret;
  }

  // Otherwise, add the "all values" option as the first item in the filter
  // list.
  ret.unshift(allValueOption);
  return ret;
}

function onHeaderClick(event) {
  const $this = $(this);
  const { $selectContainerElt } = event.data;
  // Turn the triangles down to indicate an open optgroup
  $this.toggleClass('dropdown-header-right');
  $this.toggleClass('dropdown-header-down');

  const optgroup = $this.data('optgroup');
  const $liContainer = $selectContainerElt
    .find(`li[data-optgroup="${optgroup.toString()}"]`)
    .not('.dropdown-header,.divider')
    .toggle();

  if ($liContainer.is(':visible')) {
    // Scroll down a bit if toggling on.
    const $scrollableMenu = $selectContainerElt.find('.dropdown-menu.inner');
    $scrollableMenu.scrollTop($scrollableMenu.scrollTop() + 20);
  }

  return false;
}

export default class SelectFilter extends React.PureComponent<Props, State> {
  static defaultProps: $AllowZenModelDefaultProp = {
    disabled: false,
    displayLabel: true,
    filterType: '',
    useOptGroups: true,
    value: undefined,
  };

  _placeholderElt: $RefObject<'div'> = React.createRef();
  _selectContainerElt: $RefObject<'div'> = React.createRef();
  _selectElt: $RefObject<'select'> = React.createRef();

  @memoizeOne
  buildFilterOptions = buildFilterOptions;

  constructor(props: Props) {
    super(props);

    if (props.value) {
      console.log(
        'Filter',
        props.filterType,
        'constructed with default value',
        props.value.modelValues().criteria,
      );
    }
  }

  state = {
    initialized: false,
  };

  componentDidUpdate(): void {
    if (!this.props.value && this._selectElt.current) {
      const $selectElt: $AllowAny = $(this._selectElt.current);
      $selectElt.selectpicker('val', ALL_OPTION_VALUE);
    }
  }

  @autobind
  getDefaultSelectValue(): string {
    // Transform the `value` prop to a filter option object.
    if (!this.props.value) {
      return ALL_OPTION_VALUE;
    }
    return this.getOptionString(this.props.value.modelValues().criteria);
  }

  getAllLabel(): string {
    return this.props.filterType === 'geography' ? NATION_NAME : LABEL_ALL;
  }

  getPlaceholderLabel(): string | $ReadOnlyArray<string> {
    const { value } = this.props;
    const criteria = value ? value.criteria() : undefined;

    // If no filtering criteria has been set for this dropdown, return the
    // "all values" label.
    if (
      value === undefined ||
      !criteria ||
      Object.keys(criteria).length === 0
    ) {
      return this.getAllLabel();
    }

    // Geography filters get special treatment in the placeholder to help
    // disambiguate their values across different levels of the hierarchy.
    const filterType = value.type();
    if (filterType === 'geography') {
      const levels = [];
      GEO_FIELD_ORDERING.forEach(geoLevel => {
        if (geoLevel in criteria) {
          const criteriaString = criteria[geoLevel];
          invariant(
            typeof criteriaString === 'string',
            'A geo level should be mapped to a string.',
          );
          levels.push(criteriaString);
        }
      });
      const mostGranular = levels[levels.length - 1];
      return `${mostGranular} (${levels.reverse().toString()})`;
    }
    return Object.values(criteria).map(String);
  }

  getOptions(): $ReadOnlyArray<
    | React.Element<'optgroup'>
    | React.Element<'option'>
    | $ReadOnlyArray<React.Element<'option'>>,
  > {
    const allLabel = this.getAllLabel();
    const ret = this.buildFilterOptions(this.props.filterDimensions).map(
      (dimLevel: DimensionLevel) => {
        if (dimLevel.label === LABEL_ALL) {
          const allOption = (
            <option key="_all" value="{}">
              {allLabel}
            </option>
          );
          if (this.props.useOptGroups) {
            return (
              <optgroup
                key={LABEL_ALL}
                className="select-indicator-optgroup"
                label={LABEL_ALL}
              >
                {allOption}
              </optgroup>
            );
          }
          return [allOption, <option key="_divider" data-divider="true" />];
        }
        const options = dimLevel.childOptions.map((dimObj: DimensionObject) => (
          <option
            value={this.getOptionString(dimObj.dimensionStruct)}
            key={dimObj.value}
          >
            {dimObj.label}
          </option>
        ));
        return this.props.useOptGroups ? (
          <optgroup
            className="select-indicator-optgroup"
            key={dimLevel.groupLabel}
            label={dimLevel.groupLabel}
          >
            {options}
          </optgroup>
        ) : (
          options
        );
      },
    );
    if (this.props.useOptGroups) {
      return ret;
    }
    // Flatten the option lists.
    return [].concat(...ret);
  }

  buildPicker(): void {
    if (this._selectElt.current) {
      const $selectElt: $AllowAny = $(this._selectElt.current);
      $selectElt.selectpicker();
    }

    invariant(
      this._selectContainerElt.current,
      'selectContainterElt ref must exist',
    );
    const $selectContainerElt = $(this._selectContainerElt.current);
    if (this.props.useOptGroups) {
      // Hack!
      const $dropdownHeader = $selectContainerElt.find('.dropdown-header');

      // Set right facing triangles initially.
      $dropdownHeader.addClass('dropdown-header-right');
      $dropdownHeader.on(
        'click',
        {
          $selectContainerElt,
        },
        onHeaderClick,
      );

      $selectContainerElt
        .find('li')
        .not('.dropdown-header,.divider')
        .hide();

      // Closes optgroups when the dropdown is closed.
      $selectContainerElt.on(
        'hide.bs.dropdown',
        this.onDropdownHide.bind(this, $dropdownHeader),
      );
    }
  }

  @autobind
  getOptionString(filterObj: { [string]: mixed }): string {
    // Enforces every value key must be a filter dimension.
    return JSON.stringify(pick(filterObj, this.props.filterDimensions));
  }

  @autobind
  onPlaceholderClick() {
    if (this.state.initialized) {
      return;
    }

    // Once the state is set and the component is rendered,
    // build the select picker.
    this.setState(
      {
        initialized: true,
      },
      () => {
        this.buildPicker();
        if (this._selectElt.current) {
          const $selectElt: $AllowAny = $(this._selectElt.current);
          $selectElt.selectpicker('toggle');
        }
        if (this._placeholderElt.current) {
          const $placeholderElt: $AllowAny = $(this._placeholderElt.current);
          $placeholderElt.hide();
        }
      },
    );
  }

  @autobind
  onChange(e: SyntheticEvent<HTMLSelectElement>) {
    const $e = $(e.target);
    const eventVal = $e.val();
    const { filterType } = this.props;
    const filter = QuerySelectionFilter.create({
      type: filterType,
    });

    if (eventVal === LABEL_ALL) {
      this.props.onUpdateSelection(filterType, filter);
      return;
    }

    const selectedVal = JSON.parse(eventVal);
    if (!selectedVal) {
      // It was cleared.
      this.props.onUpdateSelection(filterType, undefined);
      return;
    }

    this.props.onUpdateSelection(
      filterType,
      filter.modelValues({
        criteria: selectedVal,
      }),
    );
  }

  onDropdownHide($dropdownHeader: JQuery) {
    invariant(
      this._selectContainerElt.current,
      'selectContainerElt ref must exist',
    );
    const $selectContainerElt = $(this._selectContainerElt.current);
    $selectContainerElt
      .find('li')
      .not('.dropdown-header,.divider')
      .hide();
    // Set triangles facing right again if dropdowns are collapsed
    $dropdownHeader.addClass('dropdown-header-right');
    $dropdownHeader.removeClass('dropdown-header-down');
  }

  maybeRenderLabel() {
    if (!this.props.displayLabel) {
      return null;
    }
    return (
      <label className="control-label" htmlFor="select-filter">
        {FILTER_CATEGORY_TEXT[this.props.filterType]}
      </label>
    );
  }

  renderPlaceholder() {
    // The logic used to create displayText matches the logic used to construct
    // labels on the backend. It's necessary to build it here because the saved
    // filter object which prepopulates this select dropdown does not retain
    // the _display attribute.
    return (
      <div className="select-indicator-container" ref={this._placeholderElt}>
        <div className="btn-group bootstrap-select show-tick form-control">
          <button
            type="button"
            className="btn dropdown-toggle btn-default bs-placeholder"
            onClick={this.onPlaceholderClick}
          >
            <span className="filter-option pull-left">
              {this.getPlaceholderLabel()}
            </span>
            <span className="bs-caret">
              <span className="caret" />
            </span>
          </button>
        </div>
      </div>
    );
  }

  renderSelectGroups() {
    return (
      <div
        ref={this._selectContainerElt}
        className="select-indicator-container"
      >
        <select
          ref={this._selectElt}
          className="form-control"
          data-non-selected-text={NON_SELECTED_TEXT}
          data-live-search="true"
          data-selected-text-format="count > 2"
          data-size="20"
          disabled={this.props.disabled}
          onChange={this.onChange}
          value={this.getDefaultSelectValue()}
        >
          {this.getOptions()}
        </select>
      </div>
    );
  }

  render() {
    const contents = this.state.initialized
      ? this.renderSelectGroups()
      : this.renderPlaceholder();

    // NOTE(pablo): If you change data-size, you may have to update
    // .select-indicator-container .dropdown-menu.open CSS rule
    // to make sure the scroll bar does not get cut off.
    return (
      <div className="form-group">
        {this.maybeRenderLabel()}
        {contents}
      </div>
    );
  }
}
