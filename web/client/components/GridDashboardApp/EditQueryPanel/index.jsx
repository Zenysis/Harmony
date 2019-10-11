// @flow
import React from 'react';

import * as Zen from 'lib/Zen';
import GridDashboardQueryResultViewTypePicker from 'components/GridDashboardApp/EditQueryPanel/GridDashboardQueryResultViewTypePicker';
import Heading from 'components/ui/Heading';
import QueryForm from 'components/QueryApp/QueryForm';
import QueryFormPanel from 'components/AdvancedQueryApp/QueryFormPanel';
import QueryResultSpec from 'models/core/QueryResultSpec';
import QuerySelections from 'models/core/wip/QuerySelections';
import SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import VerticalSideBar from 'components/GridDashboardApp/EditQueryPanel/VerticalSideBar';
import autobind from 'decorators/autobind';
import { AQT_RESULT_VIEW_ORDER } from 'components/AdvancedQueryApp/registry/viewTypes';
import { RESULT_VIEW_TYPES } from 'components/QueryResult/viewTypes';
import type DashboardItemSettings from 'models/core/Dashboard/DashboardSpecification/DashboardItemSettings';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

const TEXT = t('edit_panel');
const SIMPLE_DASHBOARD_RESULT_VIEW_ORDER: Array<ResultViewType> = [
  RESULT_VIEW_TYPES.CHART,
  RESULT_VIEW_TYPES.TIME,
  RESULT_VIEW_TYPES.TABLE,
  RESULT_VIEW_TYPES.MAP,
  RESULT_VIEW_TYPES.ANIMATED_MAP,
  RESULT_VIEW_TYPES.HEATMAP,
  RESULT_VIEW_TYPES.HEATTILES,
  RESULT_VIEW_TYPES.BUBBLE_CHART,
  RESULT_VIEW_TYPES.BUMP_CHART,
  RESULT_VIEW_TYPES.SUNBURST,
  RESULT_VIEW_TYPES.EXPANDOTREE,
  RESULT_VIEW_TYPES.BOX,
];

type Props = {
  id: string,
  initialViewType: ResultViewType,
  queryResultSpec: QueryResultSpec,
  querySelections: SimpleQuerySelections | QuerySelections,
  onClosePanel: (event: SyntheticEvent<HTMLButtonElement>) => void,
  onQueryChanged: (
    id: string,
    selections: SimpleQuerySelections | QuerySelections,
    settings: DashboardItemSettings,
    viewType?: ResultViewType,
  ) => void,
};

export default class EditQueryPanel extends React.PureComponent<Props> {
  _sidebarRef: $RefObject<typeof VerticalSideBar> = React.createRef();

  getWidth(): number {
    if (this._sidebarRef.current) {
      return this._sidebarRef.current.getWidth();
    }
    return 0;
  }

  @autobind
  onUpdateSimpleDashboardItem(newSelections: SimpleQuerySelections) {
    const { queryResultSpec, id, querySelections } = this.props;

    if (!(querySelections instanceof SimpleQuerySelections)) {
      throw new Error(
        '[EditQueryPanel] onUpdateSimpleDashboardItem: querySelections model is of the wrong instance type',
      );
    }

    // need to create a new QueryResultSpec because a change in selections
    // could have triggered a change in settings
    const newSpec = queryResultSpec.updateSpecFromNewSimpleQuerySelections(
      newSelections,
      Zen.cast<SimpleQuerySelections>(querySelections),
    );
    const settings = newSpec.getSettingsForDashboard();
    this.props.onQueryChanged(id, newSelections, settings);
  }

  @autobind
  onUpdateAdvancedDashboardItem(newSelections: QuerySelections) {
    const { queryResultSpec, id, querySelections } = this.props;
    if (!(querySelections instanceof QuerySelections)) {
      throw new Error(
        '[EditQueryPanel] onUpdateAdvancedDashboardItem: querySelections model is of the wrong instance type',
      );
    }
    // need to create a new QueryResultSpec because a change in selections
    // could have triggered a change in settings
    const newSpec = queryResultSpec.updateSpecFromNewQuerySelections(
      newSelections,
      Zen.cast<QuerySelections>(querySelections),
    );
    const settings = newSpec.getSettingsForDashboard();
    this.props.onQueryChanged(id, newSelections, settings);
  }

  @autobind
  onViewTypeChange(viewType: ResultViewType) {
    const { id, queryResultSpec, querySelections } = this.props;
    const settings = queryResultSpec.getSettingsForDashboard();
    this.props.onQueryChanged(id, querySelections, settings, viewType);
  }

  renderSimpleQueryForm(querySelections: SimpleQuerySelections) {
    const selections = querySelections.legacySelections();
    return (
      <span>
        <Heading.Large className="sidebar-query-form-title">
          {TEXT.editQueryHeader}
        </Heading.Large>
        <QueryForm
          key={this.props.id}
          className="sidebar-query-form"
          mainRowClassName="row query-form__edit-main-row"
          initialSelections={selections}
          onRunQuery={this.onUpdateSimpleDashboardItem}
          persistSelections={false}
          queryButtonLabel={TEXT.updateButtonText}
          liveSelections
        />
      </span>
    );
  }

  renderAdvancedQueryForm(querySelections: QuerySelections) {
    return (
      <QueryFormPanel
        key={this.props.id}
        queryResultSpec={undefined}
        querySelections={querySelections}
        onQuerySelectionsChange={this.onUpdateAdvancedDashboardItem}
      />
    );
  }

  renderViewTypePicker() {
    const { initialViewType, querySelections } = this.props;
    const resultViewOrder =
      querySelections instanceof QuerySelections
        ? AQT_RESULT_VIEW_ORDER
        : SIMPLE_DASHBOARD_RESULT_VIEW_ORDER;

    const headingClass =
      querySelections instanceof QuerySelections
        ? 'aqt-query-form-panel__title'
        : 'query-form-panel-title';

    return (
      <div className="edit-view-type">
        <Heading.Large className={headingClass}>
          {TEXT.changeVisualizationHeader}
        </Heading.Large>
        <GridDashboardQueryResultViewTypePicker
          viewType={initialViewType}
          onViewTypeChange={this.onViewTypeChange}
          resultViewOrder={resultViewOrder}
        />
      </div>
    );
  }

  renderQueryForm() {
    const { querySelections } = this.props;
    if (querySelections instanceof SimpleQuerySelections) {
      return this.renderSimpleQueryForm(
        Zen.cast<SimpleQuerySelections>(querySelections),
      );
    }
    if (querySelections instanceof QuerySelections) {
      return this.renderAdvancedQueryForm(
        Zen.cast<QuerySelections>(querySelections),
      );
    }
    throw new Error('[EditQueryPanel] Invalid query selections in props');
  }

  render() {
    const { querySelections } = this.props;

    const buttonsClassName =
      querySelections instanceof QuerySelections
        ? 'aqt-side-bar-buttons'
        : 'side-bar-buttons';

    return (
      <VerticalSideBar
        buttonsClassName={buttonsClassName}
        ref={this._sidebarRef}
        onClosePanel={this.props.onClosePanel}
      >
        {this.renderViewTypePicker()}
        {this.renderQueryForm()}
      </VerticalSideBar>
    );
  }
}
