// @flow
import * as React from 'react';
import classNames from 'classnames';

import * as Zen from 'lib/Zen';
import DirectoryService from 'services/DirectoryService';
import Dropdown from 'components/ui/Dropdown';
import LoadingSpinner from 'components/ui/LoadingSpinner';
import { autobind, memoizeOne } from 'decorators';
import { uniqueId } from 'util/util';
import type DashboardMeta from 'models/core/Dashboard/DashboardMeta';

type Props = {
  dashboards: Zen.Array<DashboardMeta>,
  defaultDisplayContent: string,
  onDashboardSelection: (
    dashboardName: string,
    e: SyntheticEvent<HTMLElement>,
  ) => void,
  onNewDashboardClick: () => void,

  canCreateDashboards: boolean,
  className: string,
  getActiveUsername: () => string,
  onOpenDropdownClick: () => void,
  showLoadingSpinner: boolean,
  useDashboardGroups: boolean,
};

type State = {
  maxDashboardOptionLength: number,
};

const TEXT = t('common.DashboardsDropdown');

function getMaximumDashboardOptionLength(deviceWidth: number): number {
  if (deviceWidth < 321) {
    return 22;
  }

  if (deviceWidth < 678) {
    return 26;
  }

  return 40;
}

function dashboardsToOptions(
  dashboards: Zen.Array<DashboardMeta>,
  maxStringLength?: number,
): Array<React.Element<Class<Dropdown.Option<string>>>> {
  return dashboards.mapValues(dashboard => {
    const { slug, title } = dashboard.modelValues();
    return (
      <Dropdown.Option
        key={slug}
        value={slug}
        searchableText={title}
        maxOptionCharacterCount={maxStringLength}
      >
        {title}
      </Dropdown.Option>
    );
  });
}

export default class DashboardsDropdown extends React.PureComponent<
  Props,
  State,
> {
  static defaultProps = {
    className: '',
    canCreateDashboards: false,
    getActiveUsername: DirectoryService.getActiveUsername,
    onOpenDropdownClick: undefined,
    showLoadingSpinner: false,
    useDashboardGroups: true,
  };

  state = {
    maxDashboardOptionLength: getMaximumDashboardOptionLength(
      window.innerWidth,
    ),
  };

  componentDidMount() {
    window.addEventListener('resize', this.onWindowResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onWindowResize);
  }

  @memoizeOne
  getMyDashboards(
    dashboards: Zen.Array<DashboardMeta>,
    activeUsername: string,
  ): Zen.Array<DashboardMeta> {
    const myDashboards = dashboards.filter(
      dashboard => dashboard.author() === activeUsername,
    );
    return myDashboards;
  }

  @memoizeOne
  getOtherDashboards(
    dashboards: Zen.Array<DashboardMeta>,
    activeUsername: string,
  ): Zen.Array<DashboardMeta> {
    const otherDashboards = dashboards.filter(
      dashboard => dashboard.author() !== activeUsername,
    );
    return otherDashboards;
  }

  @memoizeOne
  getAllDashboards(
    dashboards: Zen.Array<DashboardMeta>,
    activeUsername: string,
  ): Zen.Array<DashboardMeta> {
    return this.getMyDashboards(dashboards, activeUsername).concat(
      this.getOtherDashboards(dashboards, activeUsername),
    );
  }

  @autobind
  onSelectionChange(selectionValue: string, e: SyntheticEvent<HTMLElement>) {
    if (selectionValue === 'new-dashboard') {
      this.props.onNewDashboardClick();
    } else {
      this.props.onDashboardSelection(selectionValue, e);
    }
  }

  @autobind
  onWindowResize() {
    this.setState({
      maxDashboardOptionLength: getMaximumDashboardOptionLength(
        window.innerWidth,
      ),
    });
  }

  maybeRenderNewDashboardButton() {
    if (this.props.canCreateDashboards) {
      const wrapperClass = 'dashboards-dropdown__new-dashboard-option-wrapper';
      const wrapperClassName = classNames(wrapperClass, {
        [`${wrapperClass}--border-btm`]: this.props.dashboards.size() > 0,
      });

      return (
        <Dropdown.Option
          disableSearch
          value="new-dashboard"
          wrapperClassName={wrapperClassName}
        >
          <span zen-test-id="new-dashboard-option">
            <i className="glyphicon glyphicon-plus" aria-hidden />
            <span className="dashboards-dropdown__new-dashboard-option-label">
              {TEXT.newDashboard}
            </span>
          </span>
        </Dropdown.Option>
      );
    }

    return null;
  }

  maybeRenderLoadingSpinner() {
    if (this.props.showLoadingSpinner) {
      const key = `__LOADING_SPINNER__${uniqueId()}`;
      return (
        <Dropdown.Option key={key} value={key}>
          <LoadingSpinner />
        </Dropdown.Option>
      );
    }
    return null;
  }

  renderMyDashboards() {
    const { dashboards, getActiveUsername } = this.props;
    const myDashboards = this.getMyDashboards(dashboards, getActiveUsername());
    return (
      <Dropdown.OptionsGroup
        key="myDashboards"
        label={TEXT.myDashboards}
        id="my-dashboards"
        searchableText={TEXT.myDashboards}
      >
        {this.maybeRenderLoadingSpinner()}
        {dashboardsToOptions(myDashboards, this.state.maxDashboardOptionLength)}
      </Dropdown.OptionsGroup>
    );
  }

  renderOtherDashboards() {
    const { dashboards, getActiveUsername } = this.props;
    const otherDashboards = this.getOtherDashboards(
      dashboards,
      getActiveUsername(),
    );
    return (
      <Dropdown.OptionsGroup
        key="otherDashboards"
        label={TEXT.otherDashboards}
        id="other-dashboards"
        searchableText={TEXT.otherDashboards}
      >
        {this.maybeRenderLoadingSpinner()}
        {dashboardsToOptions(
          otherDashboards,
          this.state.maxDashboardOptionLength,
        )}
      </Dropdown.OptionsGroup>
    );
  }

  renderDashboardLists() {
    const { useDashboardGroups, dashboards, getActiveUsername } = this.props;
    if (useDashboardGroups) {
      return [this.renderMyDashboards(), this.renderOtherDashboards()];
    }
    return dashboardsToOptions(
      this.getAllDashboards(dashboards, getActiveUsername()),
      this.state.maxDashboardOptionLength,
    );
  }

  render() {
    const className = classNames('dashboards-dropdown', this.props.className);
    const { defaultDisplayContent, onOpenDropdownClick } = this.props;
    return (
      <Dropdown.Uncontrolled
        hideCaret
        enableSearch
        className={className}
        onSelectionChange={this.onSelectionChange}
        menuMaxHeight={600}
        displayCurrentSelection={false}
        defaultDisplayContent={defaultDisplayContent}
        menuAlignment={Dropdown.Alignments.RIGHT}
        initialValue={undefined}
        controlDropDownPosition={false}
        onOpenDropdownClick={onOpenDropdownClick}
      >
        {this.maybeRenderNewDashboardButton()}
        {this.renderDashboardLists()}
      </Dropdown.Uncontrolled>
    );
  }
}
