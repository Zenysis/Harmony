// @flow
import * as React from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';

import CustomCalculationsButton from 'components/QueryResult/QueryResultActionButtons/CustomCalculationsButton';
import DownloadImageButton from 'components/QueryResult/QueryResultActionButtons/DownloadImageButton';
import ExportButton from 'components/QueryResult/QueryResultActionButtons/ExportButton';
import FilterButton from 'components/QueryResult/QueryResultActionButtons/FilterButton';
import Icon from 'components/ui/Icon';
import QuerySelections from 'models/core/wip/QuerySelections';
import SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import { autobind } from 'decorators';
import { debounce } from 'util/util';
import type { ButtonControlsProps } from 'components/visualizations/common/commonTypes';

const TEXT = t('dashboard.DashboardItem');

// The number of pixels users can scroll up/down the page before menu is
// closed.
const SCROLL_THRESHOLD_PX = 100;

type Props = {
  ...ButtonControlsProps,
  itemDOMId: string,
  isLocked: boolean,
  onCloneClicked: (id: string) => void,
  onDeleteClicked: (id: string) => void,
  onOpenEditQueryPanel: (id: string) => void,
  onToggleLock: () => void,
};

type State = {
  menuPositionX: number,
  menuPositionY: number,
  showOptions: boolean,
  shouldRenderOptions: boolean,
};

export default class DashboardQueryItemMenu extends React.PureComponent<
  Props,
  State,
> {
  state = {
    menuPositionX: 0,
    menuPositionY: 0,
    showOptions: false,
    shouldRenderOptions: false,
  };

  _portalNode: HTMLDivElement = document.createElement('div');
  _optionsListElt: $RefObject<'div'> = React.createRef();
  _menuContainerElt: $RefObject<'div'> = React.createRef();
  _menuButtonElt: $RefObject<'button'> = React.createRef();
  _scrollStartPos: number = 0;
  _debouncedRecalculateMenuPosition: () => void = debounce(
    this.recalculateMenuPosition.bind(this),
    100,
    true /* immediate */,
  );

  componentDidMount() {
    if (document.body) {
      document.body.appendChild(this._portalNode);
    }
  }

  componentDidUpdate() {
    if (this.state.showOptions) {
      this._debouncedRecalculateMenuPosition();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.onDocumentClick);
    window.removeEventListener('scroll', this.onDocumentScroll);
    if (document.body) {
      document.body.removeChild(this._portalNode);
    }
  }

  recalculateMenuPosition() {
    const { itemDOMId } = this.props;
    const dashboardItemContainer = document.getElementById(itemDOMId);
    if (
      dashboardItemContainer !== null &&
      this._optionsListElt.current &&
      this._menuButtonElt.current
    ) {
      // UI Math!
      // 1. We need the location of the dashboard item
      // 2. calculate if the menu will go past the window's right edge
      // 3. if it does, place the menu to the left of the menu button
      const listElt = this._optionsListElt.current;
      const buttonElt = this._menuButtonElt.current;
      const listWidth = listElt.offsetWidth;
      const { top, right } = dashboardItemContainer.getBoundingClientRect();
      const doesMenuOverflowWindow = right + listWidth > window.innerWidth;
      const leftButtonEdge = buttonElt.getBoundingClientRect().left;

      this.setState({
        menuPositionY: top,
        menuPositionX: doesMenuOverflowWindow
          ? leftButtonEdge - listWidth - 5 // add 5px of margin to the left
          : right,
      });
    }
  }

  @autobind
  hideOptions(): void {
    this.setState({ showOptions: false });
    document.removeEventListener('click', this.onDocumentClick);
    window.removeEventListener('scroll', this.onDocumentScroll);
  }

  @autobind
  showOptions(): void {
    this.setState({ showOptions: true, shouldRenderOptions: true });
    this._scrollStartPos = window.scrollY;
    document.addEventListener('click', this.onDocumentClick);
    window.addEventListener('scroll', this.onDocumentScroll);
  }

  @autobind
  toggleOptions(): void {
    if (this.state.showOptions) {
      this.hideOptions();
    } else {
      this.showOptions();
    }
  }

  @autobind
  onDocumentScroll() {
    const newPos = window.scrollY;
    if (Math.abs(this._scrollStartPos - window.scrollY) > SCROLL_THRESHOLD_PX) {
      // Hide the menu when user starts scrolling away.
      this.hideOptions();
    }
  }

  @autobind
  onDocumentClick(e: Event) {
    if (
      !this._menuContainerElt.current ||
      (e.target instanceof window.HTMLElement &&
        !this._menuContainerElt.current.contains(e.target) &&
        !this._portalNode.contains(e.target))
    ) {
      this.hideOptions();
    }
  }

  @autobind
  onCloneClicked(id: string) {
    this.props.onCloneClicked(id);
    this.hideOptions();
  }

  @autobind
  onDeleteClicked(id: string) {
    this.props.onDeleteClicked(id);
    this.hideOptions();
  }

  @autobind
  onOpenEditQueryPanel(id: string) {
    this.props.onOpenEditQueryPanel(id);
    this.hideOptions();
  }

  @autobind
  onOpenSettingsModalClick() {
    this.props.onOpenSettingsModalClick();
    this.hideOptions();
  }

  @autobind
  onToggleLock() {
    this.props.onToggleLock();
    this.hideOptions();
  }

  maybeRenderOptions() {
    const {
      showOptions,
      shouldRenderOptions,
      menuPositionY,
      menuPositionX,
    } = this.state;

    if (!shouldRenderOptions) {
      // Don't render options until the user has clicked. Otherwise loading a
      // large dashboards will initialize many empty DOM portals.
      return null;
    }

    const style = {
      left: menuPositionX,
      top: menuPositionY,
      visibility: showOptions ? 'initial' : 'hidden',
    };
    return ReactDOM.createPortal(
      <div
        ref={this._optionsListElt}
        className="grid-dashboard-action-buttons__options-list"
        style={style}
      >
        {this.renderEditButton()}
        {this.renderSettingsButton()}
        {this.renderFilterButton()}
        {this.renderCustomCalculationsButton()}
        {this.renderExportButton()}
        {this.renderDownloadImageButton()}
        {this.renderCloneButton()}
        {this.renderRemoveButton()}
        {this.renderLockButton()}
      </div>,
      this._portalNode,
    );
  }

  renderCloneButton() {
    if (this.props.querySelections instanceof SimpleQuerySelections) {
      return (
        <button
          type="button"
          className="grid-dashboard-action-buttons__options-list__item"
          onClick={this.onCloneClicked}
        >
          <Icon type="duplicate" ariaHidden />
          <div className="grid-dashboard-action-buttons__options-list__item-text">
            {TEXT.clone}
          </div>
        </button>
      );
    }

    return null;
  }

  renderCustomCalculationsButton() {
    const {
      allFields,
      queryResultSpec,
      onCalculationSubmit,
      onDeleteCalculation,
      onEditCalculation,
    } = this.props;
    return (
      <CustomCalculationsButton
        className="grid-dashboard-action-buttons__options-list__item-dropdown-style"
        onCalculationSubmit={onCalculationSubmit}
        onEditCalculation={onEditCalculation}
        onDeleteCalculation={onDeleteCalculation}
        allFields={allFields}
        customFields={queryResultSpec.customFields()}
        showLabel
      />
    );
  }

  // TODO(nina): Figure out how to make dropdown open to left or right of menu
  renderDownloadImageButton() {
    return (
      <DownloadImageButton
        queryResultSpec={this.props.queryResultSpec}
        querySelections={this.props.querySelections}
        viewType={this.props.viewType}
        showLabel
        buttonClassName="grid-dashboard-action-buttons__options-list__item-dropdown-style"
        className="grid-dashboard-dropdown-button"
        labelClassName="grid-dashboard-action-buttons__options-list__item-text"
      />
    );
  }

  renderEditButton() {
    return (
      <button
        type="button"
        className="grid-dashboard-action-buttons__options-list__item"
        onClick={this.onOpenEditQueryPanel}
      >
        <Icon type="edit" ariaHidden />
        <div className="grid-dashboard-action-buttons__options-list__item-text">
          {TEXT.edit}
        </div>
      </button>
    );
  }

  // TODO(nina): Figure out how to make dropdown open to left or right of menu
  renderExportButton() {
    return (
      <ExportButton
        labelClassName="grid-dashboard-action-buttons__options-list__item-text"
        buttonClassName="grid-dashboard-action-buttons__options-list__item-dropdown-style"
        className="grid-dashboard-dropdown-button"
        queryResultSpec={this.props.queryResultSpec}
        querySelections={this.props.querySelections}
        showLabel
      />
    );
  }

  renderFilterButton() {
    const {
      allFields,
      queryResultSpec,
      querySelections,
      onFiltersChange,
    } = this.props;

    return (
      <FilterButton
        className="grid-dashboard-action-buttons__options-list__item-dropdown-style"
        selections={
          querySelections instanceof QuerySelections
            ? undefined
            : querySelections.get('legacySelections')
        }
        fields={allFields}
        customFields={queryResultSpec.customFields()}
        modalOptionsSelected={queryResultSpec.modalFilters()}
        onFiltersChange={onFiltersChange}
        showLabel
      />
    );
  }

  renderLockButton() {
    const { isLocked } = this.props;
    const lockState = isLocked ? 'lock' : 'unlock';
    const lockText = isLocked ? TEXT.unlock : TEXT.lock;

    const lockButton = (
      <button
        type="button"
        className="grid-dashboard-action-buttons__options-list__item"
        onClick={this.onToggleLock}
      >
        <Icon
          type="lock"
          className={`dash-item-${lockState}-icon`}
          ariaHidden
        />
        <div className="grid-dashboard-action-buttons__options-list__item-text">
          {lockText}
        </div>
      </button>
    );

    return lockButton;
  }

  renderRemoveButton() {
    return (
      <button
        type="button"
        className="grid-dashboard-action-buttons__options-list__item"
        onClick={this.onDeleteClicked}
      >
        <Icon type="remove" ariaHidden />
        <div className="grid-dashboard-action-buttons__options-list__item-text">
          {TEXT.delete}
        </div>
      </button>
    );
  }

  renderSettingsButton() {
    return (
      <button
        className="grid-dashboard-action-buttons__options-list__item"
        data-content={t('dashboard.DashboardItem.settings')}
        type="button"
        onClick={this.onOpenSettingsModalClick}
        zen-test-id="settings-button"
      >
        <Icon type="cog" />
        <div className="grid-dashboard-action-buttons__options-list__item-text">
          {t('query_result.common.settings')}
        </div>
      </button>
    );
  }

  render() {
    const mainClassName = classNames(
      'hide-in-screenshot',
      'query-result-action-buttons',
      'grid-dashboard-action-buttons',
    );

    return (
      <div ref={this._menuContainerElt} className={mainClassName}>
        <button
          ref={this._menuButtonElt}
          className="grid-dashboard-action-buttons__option-button"
          type="button"
          zen-test-id="settings-button"
          onClick={this.toggleOptions}
        >
          <Icon type="option-horizontal" ariaHidden />
        </button>
        {this.maybeRenderOptions()}
      </div>
    );
  }
}
