import PropTypes from 'prop-types';
import React from 'react';

import AnnotationsPanel from 'components/QueryApp/QueryForm/AnnotationsPanel';
import Button from 'components/ui/Button';
import Field from 'models/core/Field';
import IndicatorSelector from 'components/AdvancedQueryApp/QueryFormPanel/sections/IndicatorSelectionBlock/IndicatorSelector';
import Query from 'components/visualizations/common/legacy/Query';
import QueryFormSection from 'components/QueryApp/QueryForm/QueryFormSection';
import SelectDatesContainer from 'components/QueryApp/QueryForm/SelectDatesContainer';
import SelectFilter from 'components/QueryApp/QueryForm/SelectFilter';
import SelectGranularity from 'components/QueryApp/QueryForm/SelectGranularity';
import SelectIndicator from 'components/QueryApp/QueryForm/SelectIndicator';
import SelectionsPanel from 'components/QueryApp/QueryForm/SelectionsPanel';
import SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import autobind from 'decorators/autobind';
import {
  FILTER_DIMENSIONS,
  FILTER_ORDER,
  SQT_GEOGRAPHY_FILTER_DIMENSIONS,
} from 'backend_config';
import { GroupLookup, IndicatorLookup } from 'indicator_fields';
import { registerUnloadHandler } from 'util/util';

const USE_AQT_SELECTOR = false;

// Don't use localstorage from before this date.
const USE_LOCALSTORAGE_AFTER = new Date(2019, 0, 9).getTime();

const SELECTIONS_FROM_STORAGE = (() => {
  const lastUpdated = parseInt(localStorage.lastUpdated, 10);
  if (Number.isNaN(lastUpdated) || lastUpdated < USE_LOCALSTORAGE_AFTER) {
    // Expired localStorage.
    console.warn('Expiring localStorage, last updated', lastUpdated);
    localStorage.querySelections = '';
    localStorage.querySelectionsArray = '';
    localStorage.lastUpdated = new Date().getTime();
  }

  if (!localStorage.querySelectionsArray) {
    // Nothing stored.
    return null;
  }

  try {
    // Pull latest query from localStorage.
    return JSON.parse(
      localStorage.querySelectionsArray[
        localStorage.querySelectionsArray.length - 1
      ],
    );
  } catch (exception) {
    return null;
  }
})();

const TEXT = t('query_form.selections');
const DROPDOWN_COMPONENTS =
  window.__JSON_FROM_BACKEND.indicatorSelectionDropdowns;

const SHOW_INDICATOR_NOTES = window.__JSON_FROM_BACKEND.showIndicatorNotes;

const propTypes = {
  onRunQuery: PropTypes.func.isRequired, // f(selections: SimpleQuerySelections)

  className: PropTypes.string,
  initialSelections: PropTypes.object,
  mainRowClassName: PropTypes.string,
  persistSelections: PropTypes.bool,
  queryButtonLabel: PropTypes.string,
};

const defaultProps = {
  className: 'query-form',
  initialSelections: {},
  mainRowClassName: 'row query-form__main-row',
  persistSelections: true,
  queryButtonLabel: t('query_form.button.label'),
};

export default class QueryForm extends React.PureComponent {
  constructor(props) {
    super(props);
    const urlQuerySelections = window.location.hash
      ? JSON.parse(decodeURIComponent(window.location.hash.slice(3)))
      : {};
    const initialSelectionsJSON = Object.assign(
      SimpleQuerySelections.create().legacySelections(),
      SELECTIONS_FROM_STORAGE,
      urlQuerySelections,
      this.props.initialSelections,
    );
    const selections = SimpleQuerySelections.fromLegacyObject(
      initialSelectionsJSON,
    );
    this.state = {
      selections,
      showLoader: false,
      showMoreFilters: false,
    };
    // Programmatically creating & binding all of the onChange and
    // onRemove functions for the dropdown indicator selections.
    this._fieldTypeClearHandlers = {};
    DROPDOWN_COMPONENTS.forEach(component => {
      const { selectionType } = component;
      this._fieldTypeClearHandlers[selectionType] = () =>
        this.onClearFieldType(selectionType);
    });
    this.onResetSelections = this.onResetSelections.bind(this);
    this.onRunQueryClick = this.onRunQueryClick.bind(this);
    this.onShowMoreFiltersClick = this.onShowMoreFiltersClick.bind(this);

    this.onChangeDenominator = this.onChangeDenominator.bind(this);
    this.onChangeStartDate = this.onChangeStartDate.bind(this);
    this.onChangeEndDate = this.onChangeEndDate.bind(this);
    this.onChangeDateType = this.onChangeDateType.bind(this);
    this.onChangeFilter = this.onChangeFilter.bind(this);
    this.onChangeGranularity = this.onChangeGranularity.bind(this);

    this.onRemoveDenominator = this.onRemoveDenominator.bind(this);
  }

  componentDidUpdate() {
    if (this.props.persistSelections) {
      const selectionsObject = this.state.selections.legacySelections();
      const selectionsJSON = JSON.stringify(selectionsObject);

      let localStorageObject;
      if (localStorage.querySelectionsArray) {
        localStorageObject = JSON.parse(
          localStorage.querySelectionsArray,
        ).slice(-10);
      } else {
        localStorageObject = [];
      }
      localStorageObject.push(selectionsObject);
      localStorage.querySelectionsArray = JSON.stringify(localStorageObject);
      localStorage.lastUpdated = new Date().getTime();
      window.location.hash = `q=${encodeURIComponent(selectionsJSON)}`;
    }
  }

  getFilterCount() {
    const { filters } = this.state.selections.modelValues();
    let count = 0;
    Object.keys(filters).forEach(filterKey => {
      const { criteria } = filters[filterKey].modelValues();
      count += Object.keys(criteria).length;
    });
    return count;
  }

  onChangeFilter(filterType, newFilter) {
    this.setState(
      ({ selections }) => ({
        selections: selections.setFilter(filterType, newFilter),
      }),
      () => {
        analytics.track('Updated filters selection', {
          selectionValue: this.state.selections.legacyFilters(),
        });
      },
    );
  }

  onChangeSingleSelectionValue(selectionFn, selectionValue) {
    this.setState(
      ({ selections }) => ({
        selections: selectionFn.call(selections, selectionValue),
      }),
      () => {
        analytics.track(`Updated ${selectionFn.name} selection`, {
          selectionValue,
        });
      },
    );
  }

  onChangeFieldsSelection(fieldType, fields, prevFields) {
    this.setState(
      ({ selections }) => {
        const currentFields = new Set(Field.pullIds(prevFields));
        const selectedFields = new Set(Field.pullIds(fields));

        // figure out what fields were removed & added
        const removedFields = new Set(
          Field.pullIds(prevFields.filter(f => !selectedFields.has(f.id()))),
        );
        const addedFields = fields.filter(f => !currentFields.has(f.id()));

        // now remove the necessary fields, and add the new ones
        const newFields = selections
          .fields()
          .filter(f => !removedFields.has(f.id()))
          .concat(addedFields);
        return { selections: selections.updateFields(newFields) };
      },
      () => {
        analytics.track('Select indicator', {
          fieldType,
          selectionValue: Field.pullIds(fields),
          groupIds: fields.map(field => IndicatorLookup[field.id()].groupId),
        });
      },
    );
  }

  @autobind
  onFieldClick(fieldId) {
    const { groupId } = IndicatorLookup[fieldId];
    const fieldType = GroupLookup[groupId]
      ? GroupLookup[groupId].selectionType
      : undefined;

    // TODO(stephen): I know denominators are gone, but should we still handle
    // it for legacy dashboards that have it set?
    this.setState(
      ({ selections }) => {
        const selectedFields = selections.fields().slice();
        // A forecast field might secretly add an indicator to the list of
        // fields that has the same fieldId as another selectable indicator.
        // However, that field will be added as type "FORECAST_DEPENDENCY". If
        // the user clicks a field whose ID already exists in the selected
        // fields, we test to see if that field was added as a forecast
        // dependency. If it was added as a forecast dependency, we want to
        // replace it with a real field so that the dropdowns show the field
        // as selected.
        const fieldAlreadySelected = selectedFields.some(
          field =>
            field.id() === fieldId &&
            field.type() !== Field.Types.FORECAST_DEPENDENCY,
        );

        const newFields = selectedFields.filter(
          field => field.id() !== fieldId,
        );
        if (!fieldAlreadySelected) {
          newFields.push(
            Field.create({
              id: fieldId,
              type: fieldType,
            }),
          );
        }

        return { selections: selections.updateFields(newFields) };
      },
      () => {
        const selectedFieldIds = Field.pullIds(this.state.selections.fields());
        analytics.track('Select indicator', {
          fieldType,
          selectionValue: selectedFieldIds,
          // NOTE(stephen): This is not great. It does not deduplicate the
          // groups. Also, how is this useful?
          groupIds: selectedFieldIds.map(
            selectedFieldId => IndicatorLookup[selectedFieldId].groupId,
          ),
        });
      },
    );
  }

  onClearFieldType(fieldType) {
    this.setState(({ selections }) => {
      const selectedFields = selections.getFieldsByType(fieldType);
      if (selectedFields.length === 0) {
        return undefined;
      }

      const fieldIds = Field.pullIds(selectedFields);
      const newFields = selections
        .fields()
        .filter(field => !fieldIds.includes(field.id()));
      return {
        selections: selections.updateFields(newFields),
      };
    });
  }

  onRemoveFieldFromList(fieldType, field) {
    this.setState(
      ({ selections }) => {
        const newFields = selections.fields().filter(f => f !== field);
        return { selections: selections.fields(newFields) };
      },
      () => {
        analytics.track('Select indicator', {
          fieldType,
          selectionValue: field.id(),
        });
      },
    );
  }

  onChangeDateType(dateType) {
    this.onChangeSingleSelectionValue(
      SimpleQuerySelections.prototype.dateType,
      dateType,
    );
  }

  onChangeDenominator(fields) {
    this.onChangeSingleSelectionValue(
      SimpleQuerySelections.prototype.denominator,
      fields[0],
    );
  }

  onChangeStartDate(startDate) {
    this.onChangeSingleSelectionValue(
      SimpleQuerySelections.prototype.startDate,
      startDate,
    );
  }

  onChangeEndDate(endDate) {
    this.onChangeSingleSelectionValue(
      SimpleQuerySelections.prototype.endDate,
      endDate,
    );
  }

  onChangeGranularity(granularity) {
    this.onChangeSingleSelectionValue(
      SimpleQuerySelections.prototype.granularity,
      granularity,
    );
  }

  onResetSelections() {
    this.setState({ selections: SimpleQuerySelections.create() });
    analytics.track('Reset selections');
  }

  onRunQueryClick(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!this.state.selections.validFieldsSelected()) {
      analytics.track('Error: no fields selected');
      // TODO(ian): i18n
      // eslint-disable-next-line no-undef
      toastr.error('Please select some fields to query.');
      return;
    }
    if (!this.state.selections.startDateBeforeEndDate()) {
      analytics.track('Error: Invalid dates selected');
      // eslint-disable-next-line no-undef
      toastr.error('Please select valid dates.');
      return;
    }

    this.setState({
      showLoader: true,
    });

    // TODO(ian): Handle failure.

    // Kick off new query even though the individual visualizations can
    // do this themselves. Gives a performance boost.
    const startTime = new Date();
    // TODO(pablo): change Query class to work with SimpleQuerySelections
    // model once we're ready to change all visualizations to use the
    // Selections model too
    new Query()
      .buildRequest(this.state.selections.legacySelections())
      .run()
      .then(data => {
        // NOTE(stephen): Leaving logging in for now even though the response
        // isn't used. The query form kicks off the first request, so its
        // timing will be accurate
        const endTime = new Date();
        analytics.track('Run query complete', {
          elapsed: endTime - startTime,
          selections: this.state.selections.legacySelections(),
        });
        return data;
      })
      .catch(failure => {
        console.error(failure);
        analytics.track('Query Error', failure);
        this.setState({
          showLoader: false,
        });
      });

    // Return immediately since the query results can now be shown
    // without needing the server request to complete.
    this.setState({ showLoader: false });
    this.props.onRunQuery(this.state.selections);

    // Track query run.
    const groupIds = [];
    const indicatorText = [];
    this.state.selections.fields().forEach(field => {
      const lookup = IndicatorLookup[field.id()];
      if (!lookup) {
        return;
      }
      groupIds.push(lookup.groupId);
      indicatorText.push(lookup.text);
    });
    analytics.track('Run query', {
      numIndicators: this.state.selections.fields().length,
      groupIds,
      indicatorText,
      selections: this.state.selections.legacySelections(),
      deepLink: window.location.href,
    });

    // Other
    registerUnloadHandler();
  }

  onShowMoreFiltersClick(e) {
    e.preventDefault();
    e.stopPropagation();
    this.setState(({ showMoreFilters }) => ({
      showMoreFilters: !showMoreFilters,
    }));
  }

  onRemoveDenominator() {
    this.onChangeSingleSelectionValue(
      SimpleQuerySelections.prototype.denominator,
      undefined,
    );
  }

  @autobind
  onItemSelect(hierarchyItem) {
    const fieldId = hierarchyItem.metadata().id();

    // TODO(nina): Indicators are currently only HealthIndicatorField types,
    // need to account for DHIS2, Surveys, etc etc
    this.setState(prevState => {
      const { selections } = prevState;
      const newField = Field.create({
        id: fieldId,
        type: Field.Types.HEALTH_INDICATOR,
      });
      const newSelections = selections
        .deepUpdate()
        .fields()
        .concat(newField);
      return { selections: newSelections };
    });
  }

  maybeRenderDateWarning() {
    if (this.state.selections.startDateBeforeEndDate()) {
      return null;
    }

    return (
      <div className="alert" id="valid-dates" style={{ color: 'red' }}>
        {t('query_form.date_alert.label')}
      </div>
    );
  }

  renderDimensionFiltersExceptFor(excludeFilterType) {
    return FILTER_ORDER.filter(filterType => filterType !== excludeFilterType)
      .map(filterType => this.renderDimensionFilterByTypeIfAllowed(filterType))
      .filter(filterElt => !!filterElt);
  }

  renderDimensionFilterByTypeIfAllowed(filterType, forceDisplay) {
    // Set forceDisplay to true if you want to always show this dimension filter
    const { selections } = this.state;
    const enabledDimensions = selections.enabledDimensions();
    if (!enabledDimensions.has(filterType) && !forceDisplay) {
      return null;
    }

    // HACK (david): Temporary fix to the wrong filter dimensions being in sqt
    const filterDimensions =
      filterType === 'geography'
        ? SQT_GEOGRAPHY_FILTER_DIMENSIONS
        : FILTER_DIMENSIONS[filterType] || [];

    return (
      <SelectFilter
        key={filterType}
        filterType={filterType}
        filterDimensions={filterDimensions}
        onUpdateSelection={this.onChangeFilter}
        value={selections.getFilter(filterType)}
      />
    );
  }

  renderDimensionFiltersGroup() {
    if (
      Object.keys(FILTER_ORDER).length === 1 &&
      FILTER_ORDER[0] === 'geography'
    ) {
      // There's only a geography filter.
      return this.renderDimensionFilterByTypeIfAllowed('geography', true);
    }
    const nonGeoFilters = this.renderDimensionFiltersExceptFor('geography');
    let filterButton = null;
    if (nonGeoFilters.length > 0) {
      const filterCount = this.getFilterCount();
      const changedStr = filterCount > 0 ? `(${filterCount} changed)` : '';

      filterButton = (
        <button
          className="btn btn-default btn-show-more"
          onClick={this.onShowMoreFiltersClick}
          type="button"
        >
          {this.state.showMoreFilters
            ? `${t('query_form.show_fewer_filters')} ${changedStr}`
            : `${t('query_form.show_more_filters')} ${changedStr}`}
        </button>
      );
    }

    // Geography filter and then some other hidden filters.
    return (
      <div>
        {this.renderDimensionFilterByTypeIfAllowed('geography', true)}
        {filterButton}
        {this.state.showMoreFilters ? nonGeoFilters : null}
      </div>
    );
  }

  renderDropdownComponents() {
    const { selections } = this.state;
    const selectIndicatorComponents = [];
    DROPDOWN_COMPONENTS.forEach(component => {
      const { groupIds, selectionType } = component;
      const selectedFields = selections.getFieldsByType(selectionType);

      selectIndicatorComponents.push(
        <SelectIndicator
          key={selectionType}
          onClearSelectedFields={this._fieldTypeClearHandlers[selectionType]}
          onFieldClick={this.onFieldClick}
          label={TEXT[selectionType].label}
          selectedFields={selectedFields}
          showOnlyGroupIds={groupIds}
        />,
      );
    });

    selectIndicatorComponents.push(
      <SelectIndicator
        key="all"
        onFieldClick={this.onFieldClick}
        label={TEXT.all.label}
        selectedFields={selections.fields()}
        includeHiddenGroups
      />,
    );
    return selectIndicatorComponents;
  }

  renderPrimaryIndicatorsSection() {
    if (USE_AQT_SELECTOR) {
      return (
        <QueryFormSection title={t('query_form.sections.primary_indicators')}>
          <IndicatorSelector
            isIndicatorBlock={false}
            onItemSelect={this.onItemSelect}
          />
        </QueryFormSection>
      );
    }

    return (
      <QueryFormSection title={t('query_form.sections.primary_indicators')}>
        {this.renderDropdownComponents()}
      </QueryFormSection>
    );
  }

  renderFiltersSection() {
    const {
      dateType,
      startDate,
      endDate,
    } = this.state.selections.modelValues();
    return (
      <QueryFormSection title={t('query_form.sections.filters')}>
        <div className="form-filters">
          {this.renderDimensionFiltersGroup()}
          <SelectDatesContainer
            dateType={dateType}
            startDate={startDate}
            endDate={endDate}
            onUpdateDateType={this.onChangeDateType}
            onUpdateStartDate={this.onChangeStartDate}
            onUpdateEndDate={this.onChangeEndDate}
          />
        </div>
        {this.maybeRenderDateWarning()}
      </QueryFormSection>
    );
  }

  renderAggregationSection() {
    const { selections } = this.state;
    const { filters, granularity } = selections.modelValues();
    return (
      <QueryFormSection title={t('query_form.sections.level_of_aggregation')}>
        <SelectGranularity
          filters={filters}
          selectedFields={selections.fields()}
          value={granularity}
          onUpdate={this.onChangeGranularity}
        />
      </QueryFormSection>
    );
  }

  renderForm() {
    return (
      <div className="col-md-5 query-form__form-panel-col">
        <div className="query-form__form-panel">
          <form>
            <fieldset>
              {this.renderPrimaryIndicatorsSection()}
              {this.renderFiltersSection()}
              {this.renderAggregationSection()}
            </fieldset>
          </form>
        </div>
      </div>
    );
  }

  renderSelectionsComponents() {
    const { selections } = this.state;
    return DROPDOWN_COMPONENTS.map(component => {
      const { selectionType } = component;
      const fields = selections.getFieldsByType(selectionType);
      return (
        <SelectionsPanel
          key={selectionType}
          title={TEXT[selectionType].selected_label}
          fields={fields}
          onRemoveClick={this.onFieldClick}
        />
      );
    });
  }

  renderSelections() {
    const { selections } = this.state;
    const { fields, denominator } = selections.modelValues();
    return (
      <div className="col-md-7 query-form__selections-panel-col">
        <div className="query-form__selections-panel-section">
          {this.renderSelectionsComponents()}
          <SelectionsPanel
            title={TEXT.denominator.selected_label}
            fields={denominator ? [denominator] : []}
            onRemoveClick={this.onRemoveDenominator}
          />
          <AnnotationsPanel
            title={t('query_form.annotations_panel.title')}
            fields={fields}
            indicatorAnnotations={SHOW_INDICATOR_NOTES}
          />
        </div>
      </div>
    );
  }

  renderAnalyzeButton() {
    return (
      <div className="form-group query-button-container col-md-5">
        <Button
          className="query-form__analyze-btn"
          onClick={this.onRunQueryClick}
          disabled={this.state.showLoader}
          size={Button.Sizes.MEDIUM}
          testId="btn-start"
        >
          {this.props.queryButtonLabel}
        </Button>
        <img
          alt="loader"
          className="loader"
          src="/images/ajax-loader.gif"
          style={{ display: this.state.showLoader ? 'inline' : 'none' }}
        />
        <button
          type="button"
          className="btn btn-link query-form__reset-btn"
          onClick={this.onResetSelections}
        >
          {t('query_form.reset_form')}
        </button>
      </div>
    );
  }

  render() {
    return (
      <div className={this.props.className}>
        <div className={this.props.mainRowClassName}>
          {this.renderForm()}
          {this.renderSelections()}
        </div>
        <div className="row query-form__buttons">
          {this.renderAnalyzeButton()}
        </div>
      </div>
    );
  }
}

QueryForm.propTypes = propTypes;
QueryForm.defaultProps = defaultProps;
