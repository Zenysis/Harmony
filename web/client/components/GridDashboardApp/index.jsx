// @flow
import * as React from 'react';
import ReactDOM from 'react-dom';
import ReactDOMServer from 'react-dom/server';
import ReactGridLayout from 'react-grid-layout';
import classNames from 'classnames';
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import AuthorizationService, {
  DASHBOARD_PERMISSIONS,
  RESOURCE_TYPES,
} from 'services/AuthorizationService';
import Dashboard from 'models/core/Dashboard';
import DashboardEditableTextItem from 'components/GridDashboardApp/DashboardEditableTextItem';
import DashboardQueryItem, {
  DASHBOARD_ITEM_MODES,
} from 'components/GridDashboardApp/DashboardQueryItem';
import DashboardService from 'services/DashboardService';
import EditQueryPanel from 'components/GridDashboardApp/EditQueryPanel';
import GridDashboardControls from 'components/GridDashboardApp/GridDashboardControls';
import LegacyButton from 'components/ui/LegacyButton';
import ProgressBar from 'components/ui/ProgressBar';
import QueryResult from 'components/QueryResult';
import QueryResultSpec from 'models/core/QueryResultSpec';
import ResizeService from 'services/ResizeService';
import autobind from 'decorators/autobind';
import memoizeOne from 'decorators/memoizeOne';
import withScriptLoader from 'components/common/withScriptLoader';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import {
  addTextElement,
  cloneVisualization,
  deleteQueryComponent,
  deleteTextItemComponent,
  generateStateFromModel,
  setComponentLockStatus,
  updateDashboardLayout,
  updateTextItem,
  updateQueryResultSpecification,
  updateVisualization,
} from 'components/GridDashboardApp/stateChanges';
import { debounce, scrollWindowTo } from 'util/util';
import type DashboardEditableText from 'models/core/Dashboard/DashboardSpecification/DashboardEditableText';
import type DashboardItemSettings from 'models/core/Dashboard/DashboardSpecification/DashboardItemSettings';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import type { Dimensions } from 'types/common';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';
import type { ReactGridItem } from 'components/GridDashboardApp/stateChanges';
import type { ResultViewType } from 'components/QueryResult/viewTypes';
import type { StyleObject } from 'types/jsCore';

const BACKEND_DASHBOARD_OPTIONS = window.__JSON_FROM_BACKEND.dashboard;
const DEFAULT_SPECIFICATION = BACKEND_DASHBOARD_OPTIONS.emptySpecification;
const DASHBOARD_URI = BACKEND_DASHBOARD_OPTIONS.dashboardUri;
const DASHBOARD_NAME = BACKEND_DASHBOARD_OPTIONS.activeDashboard;

const TEXT = t('dashboard_builder');

// Margin between items [x, y] in px.
// NOTE(stephen): Setting this to 0,0 since we apply our own padding between
// items through CSS. Still need to set a default margin, though, since
// react-grid-layout will default to 10,10
const DASHBOARD_ITEM_MARGIN = [0, 0];

const WINDOW_RESIZE_DEBOUNCE_TIMEOUT = 100;
const INNER_HEIGHT_THRESHOLD = 500;
const INNER_WIDTH_THRESHOLD = 780;
const GRID_LINE_COLOR = '#cccccc';

type Props = {
  /**
   * A callback that is invoked when the user wishes to retrieve a dashboard by
   * its id-specific resource URI.
   *
   * @param {String} uri The dashboard's uri
   *
   * @returns {Promise<Dashboard>} The created dashboard.
   */
  getDashboard: typeof DashboardService.getDashboardByUri,

  /**
   * A callback that is invoked when checking if the current user is a
   * Dashboard Administrator.
   *
   * @returns {Proimse<Boolean>} A promise that when complete returns whether
   *                             or not the user is a Dashboard Administrator.
   */
  checkDashboardAdmin: () => Promise<boolean>,

  /**
   * A callback that is invoked when checking if the current user is a
   * Dashboard Editor.
   *
   * @returns {Proimse<Boolean>} A promise that when complete returns whether
   *                             or not the user is a Dashboard Editor.
   */
  checkDashboardEditor: () => Promise<boolean>,

  /**
   * An instance of the resize service that alerts components when they are
   * being resized.
   */
  resizeService: typeof ResizeService,
};

type State = {
  collapsedLayout: boolean,
  collapsedLayoutMetadata: $ReadOnlyArray<ReactGridItem> | void,

  // The list of the user applied dashboard filters.
  // TODO(stephen, pablo): This should be moved into the dashboard spec once
  // the UI treatment is built out. It will need to be persisted and restored
  // when the user saves/loads the page.
  dashboardFilterItems: Zen.Array<QueryFilterItem>,
  dashboardItemToEdit: string | void,
  dashboardModel: Dashboard,
  dragging: boolean,
  editModeStyles: StyleObject | void,
  editQueryPanelWidth: number | void,
  isEditQueryPanelVisible: boolean,
  isEditor: boolean,
  isAdministrator: boolean,
  lastSavedState: $Shape<State> | void,
  loaded: boolean,
  queryResultSpecs: Zen.Map<QueryResultSpec>,
  querySelections: Zen.Map<QuerySelections | SimpleQuerySelections>,
  resizing: boolean,
  unsavedChanges: boolean,
  viewMode: boolean,
  windowHeight: number,
  windowWidth: number,
};

function scrollToTop() {
  scrollWindowTo(0, true, 300);
}

function renderScrollToTop() {
  return (
    <LegacyButton
      className="grid-dashboard-container__scroll hide-in-screenshot"
      onClick={scrollToTop}
    >
      <i className="glyphicon glyphicon-menu-up" />
    </LegacyButton>
  );
}

function shouldUseCollapsedLayout(width: number, height: number): boolean {
  return height < INNER_HEIGHT_THRESHOLD || width < INNER_WIDTH_THRESHOLD;
}

// The collapsed layout should store one item per line with a width and height
// of 1 unit. This will cause the item to fill the entire line and height.
function buildCollapsedLayoutMetadata(
  dashboardModel: Dashboard,
): $ReadOnlyArray<ReactGridItem> {
  // Since we are changing the width and height units of each item, we need to
  // also change the y positioning. Some items in normal layout can take up
  // multiple rows. In a collapsed view, an item should only take up a single
  // row. Sort the layout items by y position and then by x position to ensure
  // that items get positioned in the order of top to bottom, left to right.
  const layout = dashboardModel
    .specification()
    .items()
    .values()
    .map(item => item.reactGridItem());
  return layout
    .slice()
    .sort((a, b) => {
      if (a.y === b.y) {
        return a.x - b.x;
      }
      return a.y - b.y;
    })
    .map(({ w, h, x, y, ...rest }, idx) => ({
      ...rest,
      static: true,
      w: 1,
      h: 1,
      x: 0,
      y: idx,
    }));
}

// Capture the initial screen dimensions so we can initialize the collapsed
// layout.
// NOTE(stephen): We know that the document body will always be non-null.
// Cast it to a non-null type so that Flow is happy.
const DOCUMENT_BODY = ((document.body: any): HTMLBodyElement);
const INITIAL_SCREEN_HEIGHT = DOCUMENT_BODY.clientHeight;
const INITIAL_SCREEN_WIDTH = DOCUMENT_BODY.clientWidth;

class BaseGridDashboardApp extends React.PureComponent<Props, State> {
  static defaultProps = {
    getDashboard: DashboardService.getDashboardByUri,
    resizeService: ResizeService,

    checkDashboardEditor: () =>
      AuthorizationService.isAuthorized(
        DASHBOARD_PERMISSIONS.EDIT,
        RESOURCE_TYPES.DASHBOARD,
        DASHBOARD_NAME,
      ),

    checkDashboardAdmin: () =>
      AuthorizationService.isAuthorized(
        DASHBOARD_PERMISSIONS.UPDATE_USERS,
        RESOURCE_TYPES.DASHBOARD,
        DASHBOARD_NAME,
      ),
  };

  static renderToDOM(elementId?: string = 'app') {
    const elt: ?HTMLElement = document.getElementById(elementId);
    invariant(elt, `Element ID does not exist: ${elementId}`);
    ReactDOM.render(<GridDashboardApp />, elt);
  }

  state = {
    collapsedLayout: shouldUseCollapsedLayout(
      INITIAL_SCREEN_WIDTH,
      INITIAL_SCREEN_HEIGHT,
    ),
    collapsedLayoutMetadata: undefined,
    dashboardFilterItems: Zen.Array.create(),
    dashboardItemToEdit: undefined,
    dashboardModel: Dashboard.create(),
    dragging: false,
    editModeStyles: undefined,
    editQueryPanelWidth: undefined,
    isEditQueryPanelVisible: false,
    isEditor: false,
    isAdministrator: false,
    lastSavedState: undefined,
    loaded: false,
    queryResultSpecs: Zen.Map.create(),
    querySelections: Zen.Map.create(),
    resizing: false,
    unsavedChanges: false,
    viewMode: true,
    windowHeight: INITIAL_SCREEN_HEIGHT,
    windowWidth: INITIAL_SCREEN_WIDTH,
  };

  _editPanelRef: $RefObject<typeof EditQueryPanel> = React.createRef();
  _editedQueryResultRef: $RefObject<'div'> = React.createRef();
  _pushedRef: $RefObject<'div'> = React.createRef();
  _resizeSubscription = undefined;

  componentDidMount() {
    window.addEventListener('beforeunload', this.onUnload);
    // Watch for resize events so we can adjust the column count.
    this._resizeSubscription = this.props.resizeService.subscribe(
      debounce(this.onWindowResize, WINDOW_RESIZE_DEBOUNCE_TIMEOUT),
    );
    // Pull specification from backend.
    this.props
      .checkDashboardEditor()
      .then(result => {
        this.setState({ isEditor: result, viewMode: false });
      })
      .catch(() => {
        console.info(TEXT.not_editor);
      });

    this.props
      .checkDashboardAdmin()
      .then(result => {
        this.setState({ isAdministrator: result });
      })
      .catch(() => {
        console.info(TEXT.not_admin);
      });

    this.load().then(() => {
      this.setState({ unsavedChanges: false });
    });
    document.title = TEXT.default_title;
  }

  componentDidUpdate() {
    // NOTE(stephen): For some reason, changing the document title every time
    // the component updated caused a detectable performance hit in Chrome's
    // performance profiler. Instead of updating each time, only update when
    // the title needs to be changed.
    let title = TEXT.default_title;
    const specification = this.state.dashboardModel.specification();
    if (specification) {
      title = specification.dashboardOptions().title();
    }
    if (document.title !== title) {
      document.title = title;
    }
    // track the EditQueryPanel's width
    if (this._editPanelRef.current) {
      this.setState({
        editQueryPanelWidth: this._editPanelRef.current.getWidth(),
      });
    } else {
      this.setState({ editQueryPanelWidth: undefined });
    }
  }

  componentWillUnmount() {
    if (this._resizeSubscription) {
      this.props.resizeService.unsubscribe(this._resizeSubscription);
    }
  }

  /**
   * Load the dashboard. If `useDefaultFallback` is set to true then we will
   * load a default empty specification if the dashboard fails to load.
   */
  load(useDefaultFallback?: boolean = false): Promise<void> {
    const dashboardFallback = useDefaultFallback
      ? DEFAULT_SPECIFICATION
      : undefined;

    return this.props
      .getDashboard(DASHBOARD_URI, dashboardFallback)
      .then(dashboardModel => {
        console.info('Loaded dashboard from backend with id', DASHBOARD_NAME);
        const newState = generateStateFromModel(dashboardModel);
        newState.unsavedChanges = false;
        newState.collapsedLayoutMetadata = this.state.collapsedLayout
          ? buildCollapsedLayoutMetadata(dashboardModel)
          : undefined;
        this.setState({ ...newState, lastSavedState: newState });
      })
      .catch(error => {
        window.toastr.error(TEXT.load_dashboard_error);
        console.warn(error);

        // things failed to load, so try again but now use a default fallback
        if (!useDefaultFallback) {
          return this.load(true);
        }
        return {};
      });
  }

  getInnerContainerStyle(): StyleObject | void {
    if (this.state.editQueryPanelWidth !== undefined) {
      return {
        transform: `translateX(${this.state.editQueryPanelWidth}px)`,
      };
    }
    return undefined;
  }

  @autobind
  updateDashboardState(newState: State, thenFunction: () => void): void {
    return this.setState(newState, thenFunction);
  }

  @autobind
  updateDashboardLastSavedState(): void {
    const {
      loaded,
      dashboardModel,
      queryResultSpecs,
      querySelections,
    } = this.state;
    this.setState({
      lastSavedState: {
        loaded,
        dashboardModel,
        queryResultSpecs,
        querySelections,
      },
    });
  }

  @autobind
  controlEditedQueryHeightAndScrollPosition(): void {
    // recalculate the new height of the dashboard being edited
    const { current } = this._editedQueryResultRef;
    if (current) {
      // use style to get the actual height set by ReactGridLayout
      const currentHeight = +current.style.height.slice(0, -2);
      const BUTTON_HEIGHT = 30;

      // reduce query result height by button height & move it down by the
      // same height
      this.setState(prevState => {
        if (!prevState.editModeStyles) {
          // If the edit panel was previously closed
          // Since the dashboard shrinks when the edit panel is opened,
          // we need to scroll up so that the item being edited stays in
          // view
          const yOffset = -0.3 * window.pageYOffset;
          window.scrollTo(window.pageXOffset, window.pageYOffset + yOffset);
        } else {
          // When another result query is selected to be edited. Scroll
          // into the view and place it in the center of the screen
          current.scrollIntoView({
            block: 'center',
          });
        }

        // ReactGridLayout overrides the width and height. So to reduce the
        // height, we set the maxHeight style property of the edited query
        // result instead
        return {
          editModeStyles: {
            marginTop: `${BUTTON_HEIGHT}px`,
            maxHeight: `${currentHeight - BUTTON_HEIGHT}px`,
          },
        };
      });
    }
  }

  @autobind
  handleClickOutside({ target }: MouseEvent): void {
    const pushedElt = this._pushedRef.current;
    const editedQueryElt = this._editedQueryResultRef.current;
    if (
      target instanceof window.Node &&
      pushedElt &&
      pushedElt.contains(target) &&
      editedQueryElt &&
      !editedQueryElt.contains(target)
    ) {
      this.onCloseEditQueryPanel();
    }
  }

  getLayoutParams(): [number, number] {
    const {
      collapsedLayout,
      windowHeight,
      windowWidth,
      dashboardModel,
    } = this.state;

    // In collapsedLayout mode, all items should be placed on a single line
    // and should fill the screen's width and height.
    // NOTE(stephen): It looks like ReactGridLayout isn't handling the change
    // of columnCount, rowHeight, and windowWidth all at once. When this
    // happens, the columnCount is not respected. FIX THIS.
    if (collapsedLayout) {
      return [
        1, // Column count
        windowHeight - 30, // Row height
      ];
    }

    const options = dashboardModel.specification().dashboardOptions();
    const columnCount = options.columnCount();
    return [
      columnCount, // Column count
      windowWidth / columnCount, // Row height
    ];
  }

  // For the given dimensions, build a style that will show the grid lines a
  // dashboard item can be placed within.
  @memoizeOne
  buildGridLinesStyle(
    columnCount: number,
    rowHeight: number,
    gridWidth: number,
  ): StyleObject {
    const columnWidth = gridWidth / columnCount;

    // Draw a line for the start and end of each column. The column height is
    // equal to rowHeight since we are only drawing a single row.
    const columns = [];
    for (let i = 0; i < columnCount + 1; i++) {
      const x = columnWidth * i;
      columns.push(
        <line
          key={i}
          stroke={GRID_LINE_COLOR}
          strokeWidth="1.5"
          x1={x}
          y1="0"
          x2={x}
          y2={rowHeight}
        />,
      );
    }

    // Draw the top and bottom lines of a single row.
    const rows = (
      <React.Fragment>
        <line
          stroke={GRID_LINE_COLOR}
          strokeWidth="1.5"
          x1="0"
          y1="0"
          x2={gridWidth}
          y2="0"
        />
        <line
          stroke={GRID_LINE_COLOR}
          strokeWidth="1.5"
          x1="0"
          y1={rowHeight}
          x2={gridWidth}
          y2={rowHeight}
        />
      </React.Fragment>
    );

    // Put it all together into an SVG.
    const grid = (
      <svg
        height={rowHeight}
        width={gridWidth}
        xmlns="http://www.w3.org/2000/svg"
      >
        {columns}
        {rows}
      </svg>
    );

    // Convert the SVG into a string so it can be used as a background image.
    const svgStr = encodeURIComponent(
      ReactDOMServer.renderToStaticMarkup(grid),
    );

    // Build a style that uses the SVG as the background image and use
    // background-repeat to draw the single row multiple times on the page.
    return {
      backgroundImage: `url(data:image/svg+xml;utf8,${svgStr})`,
      backgroundRepeat: 'repeat',
    };
  }

  getGridLinesStyle(): StyleObject | void {
    const {
      dragging,
      editQueryPanelWidth,
      resizing,
      viewMode,
      windowWidth,
    } = this.state;
    if (
      !(dragging || resizing) ||
      viewMode ||
      editQueryPanelWidth !== undefined
    ) {
      return undefined;
    }

    const [columnCount, rowHeight] = this.getLayoutParams();
    return this.buildGridLinesStyle(columnCount, rowHeight, windowWidth);
  }

  @autobind
  onUnload(event: BeforeUnloadEvent): string | null {
    const { unsavedChanges, isEditor } = this.state;
    if (unsavedChanges && isEditor) {
      const confirmationMessage = 'Changes you made may not be saved.';

      // eslint-disable-next-line no-param-reassign
      event.returnValue = confirmationMessage;
      return confirmationMessage;
    }
    return null;
  }

  @autobind
  onComponentLockChanged(componentId: string, isLocked: boolean) {
    this.setState(setComponentLockStatus(componentId, isLocked));
  }

  @autobind
  onClone(layoutId: string) {
    this.setState(cloneVisualization(layoutId), () =>
      window.toastr.success(TEXT.tile_clone_sucess),
    );
  }

  @autobind
  onDeleteQueryComponentClicked(componentId: string) {
    if (this.state.dashboardItemToEdit === componentId) {
      this.onCloseEditQueryPanel();
    }
    this.setState(deleteQueryComponent(componentId));
  }

  @autobind
  onDeleteTextComponentClicked(componentId: string) {
    this.setState(deleteTextItemComponent(componentId));
  }

  @autobind
  onLayoutChanged(newLayout: $ReadOnlyArray<ReactGridItem>) {
    // Prevent layout changes from persisting if we are in collapsed layout
    // mode. It is not possible to properly set and modify layout in collapsed
    // mode.
    if (!this.state.collapsedLayout) {
      this.setState(updateDashboardLayout(newLayout));
    }
  }

  @autobind
  onQueryChanged(
    layoutId: string,
    selections: QuerySelections | SimpleQuerySelections,
    settings: DashboardItemSettings,
    viewType: ResultViewType | void = undefined,
  ) {
    this.setState(
      updateVisualization(layoutId, selections, settings, viewType),
    );
  }

  @autobind
  onChangeTextItem(textItem: DashboardEditableText) {
    this.setState(updateTextItem(textItem));
  }

  @autobind
  onQueryResultSpecChange(
    layoutId: string,
    viewType: ResultViewType,
    updatedQueryResultSpec: QueryResultSpec,
  ) {
    this.setState(
      updateQueryResultSpecification(
        layoutId,
        viewType,
        updatedQueryResultSpec,
      ),
    );
  }

  @autobind
  onResetDashboardFilters() {
    this.setState(prevState => ({
      ...prevState.lastSavedState,
      unsavedChanges: false,
    }));
  }

  @autobind
  onAddTextItem() {
    this.setState(
      addTextElement(),
      window.scrollTo(0, DOCUMENT_BODY.scrollHeight),
    );
  }

  @autobind
  onWindowResize(event: Event, { height, width }: Dimensions) {
    this.setState(prevState => {
      const collapsedLayout = shouldUseCollapsedLayout(width, height);
      const output = {};
      if (
        height !== prevState.windowHeight ||
        width !== prevState.windowWidth
      ) {
        output.windowHeight = height;
        output.windowWidth = width;
      }

      if (collapsedLayout !== prevState.collapsedLayout) {
        output.collapsedLayout = collapsedLayout;
        output.collapsedLayoutMetadata = collapsedLayout
          ? buildCollapsedLayoutMetadata(prevState.dashboardModel)
          : undefined;
      }
      return output;
    });
  }

  @autobind
  onItemDragStart() {
    this.setState({ dragging: true });
  }

  @autobind
  onItemDragStop() {
    this.setState({ dragging: false });
  }

  @autobind
  onItemResizeStart() {
    this.setState({ resizing: true });
  }

  @autobind
  onItemResizeStop() {
    this.setState({ resizing: false });
  }

  @autobind
  onOpenEditQueryPanel(id: string) {
    this.setState(
      { dashboardItemToEdit: id, isEditQueryPanelVisible: true },
      this.controlEditedQueryHeightAndScrollPosition,
    );
    document.addEventListener('click', this.handleClickOutside, false);
  }

  @autobind
  onCloseEditQueryPanel() {
    // Since we scroll to keep the item being edited in view we need to scroll
    // down when it is closed.
    const yOffset = 0.3 * window.pageYOffset;
    window.scrollTo(window.pageXOffset, window.pageYOffset + yOffset);
    this.setState({
      isEditQueryPanelVisible: false,
      editModeStyles: undefined,
    });
    document.removeEventListener('click', this.handleClickOutside, false);
  }

  maybeRenderEditQueryPanel() {
    const {
      dashboardModel,
      dashboardItemToEdit,
      isEditQueryPanelVisible,
      queryResultSpecs,
      querySelections,
    } = this.state;
    if (
      !isEditQueryPanelVisible ||
      dashboardItemToEdit === undefined ||
      !queryResultSpecs.has(dashboardItemToEdit) ||
      !querySelections.has(dashboardItemToEdit)
    ) {
      return null;
    }

    const viewType = dashboardModel
      .specification()
      .queries()
      .forceGet(dashboardItemToEdit)
      .type();

    return (
      <EditQueryPanel
        ref={this._editPanelRef}
        queryResultSpec={queryResultSpecs.forceGet(dashboardItemToEdit)}
        querySelections={querySelections.forceGet(dashboardItemToEdit)}
        initialViewType={viewType}
        onClosePanel={this.onCloseEditQueryPanel}
        onQueryChanged={this.onQueryChanged}
        id={dashboardItemToEdit}
      />
    );
  }

  renderDashboard() {
    const {
      collapsedLayout,
      collapsedLayoutMetadata,
      windowWidth,
      dashboardModel,
    } = this.state;
    const layoutMetadata = dashboardModel
      .specification()
      .items()
      .values()
      .map(item => item.reactGridItem());
    const layout = collapsedLayout ? collapsedLayoutMetadata : layoutMetadata;

    const [columnCount, rowHeight] = this.getLayoutParams();

    // NOTE(stephen, moriah): We are passing the layout properties at both the
    // `ReactGridLayout` parent container props level AND at as a `data-grid`
    // prop on the dashboard item directly. This is to workaround a really nasty
    // race condition bug in `ReactGridLayout` which attempts to store a
    // synchronized copy of layout in its state. Unfortunately, there are state
    // updating issues which cause their internal view to be *out of date* with
    // our parent view. The library preferences its state view of the layout and
    // will cause bugs with our newly defined layout. Passing the property as
    // both a `data-grid` prop on each child and as a layout prop at the parent
    // level fixes this. We also need to always pass the layout at the parent
    // level regardless since the library does not accurately keep track of
    // mutations to `data-grid`` on children and again becomes out of sync.
    return (
      <div className="grid-dashboard-wrapper" style={this.getGridLinesStyle()}>
        <ReactGridLayout
          className="grid-dashboard"
          draggableCancel=".react-grid-draggable-cancel,input"
          draggableHandle=".visualization-container"
          cols={columnCount}
          layout={layout}
          rowHeight={rowHeight}
          width={windowWidth}
          margin={DASHBOARD_ITEM_MARGIN}
          compactType={null}
          onDragStart={this.onItemDragStart}
          onDragStop={this.onItemDragStop}
          onLayoutChange={this.onLayoutChanged}
          onResizeStart={this.onItemResizeStart}
          onResizeStop={this.onItemResizeStop}
        >
          {this.renderDashboardItems()}
        </ReactGridLayout>
      </div>
    );
  }

  renderDashboardItems() {
    const {
      collapsedLayout,
      dashboardFilterItems,
      dashboardModel,
      dashboardItemToEdit,
      isAdministrator,
      isEditor,
      isEditQueryPanelVisible,
      viewMode,
      queryResultSpecs,
      querySelections,
    } = this.state;
    const canEdit =
      !collapsedLayout && !viewMode && (isEditor || isAdministrator);
    const dashboardQueries = dashboardModel
      .specification()
      .queries()
      .values()
      .map(query => {
        const mappingId = query.id();
        const queryResultSpec = queryResultSpecs.forceGet(mappingId);
        const querySelection = querySelections.forceGet(mappingId);
        const itemMetadata = dashboardModel
          .specification()
          .items()
          .forceGet(query.itemId())
          .reactGridItem();
        const editMode =
          mappingId === dashboardItemToEdit && isEditQueryPanelVisible
            ? DASHBOARD_ITEM_MODES.EDIT
            : DASHBOARD_ITEM_MODES.VIEW;
        const mode = viewMode ? QueryResult.Modes.PRESENT_VIEW : editMode;
        let modeDependentProps = {};

        if (mode === DASHBOARD_ITEM_MODES.EDIT) {
          modeDependentProps = {
            ref: this._editedQueryResultRef,
            style: this.state.editModeStyles,
          };
        }

        // TODO(moriah): Extract the delete, clone, and lock buttons. These
        // should be basic functionality for all dashboard items.
        return (
          <div
            key={itemMetadata.i}
            data-grid={itemMetadata}
            {...modeDependentProps}
          >
            <DashboardQueryItem
              canEdit={canEdit}
              collapsedLayout={collapsedLayout}
              dashboardFilterItems={dashboardFilterItems}
              id={mappingId}
              initialLockedState={itemMetadata.static}
              mode={mode}
              onClone={this.onClone}
              onDeleteClicked={this.onDeleteQueryComponentClicked}
              onLockToggled={this.onComponentLockChanged}
              onOpenEditQueryPanel={this.onOpenEditQueryPanel}
              onQueryResultSpecChange={this.onQueryResultSpecChange}
              queryResultSpec={queryResultSpec}
              querySelections={querySelection}
              viewType={query.type()}
            />
          </div>
        );
      });
    const dashboardTextItems = dashboardModel
      .specification()
      .textItems()
      .values()
      .map(textElement => {
        const itemMetadata = dashboardModel
          .specification()
          .items()
          .forceGet(textElement.itemId())
          .reactGridItem();
        return (
          <div key={itemMetadata.i} data-grid={itemMetadata}>
            <DashboardEditableTextItem
              id={textElement.id()}
              isLocked={itemMetadata.static}
              onTextChanged={this.onChangeTextItem}
              onLockToggled={this.onComponentLockChanged}
              onDeleteClicked={this.onDeleteTextComponentClicked}
              textElement={textElement}
            />
          </div>
        );
      });
    return [...dashboardQueries, ...dashboardTextItems];
  }

  // eslint-disable-next-line class-methods-use-this
  renderLoader() {
    return (
      <div className="grid-dashboard-progress-bar">
        <ProgressBar enabled />
      </div>
    );
  }

  renderControls() {
    const {
      dashboardModel,
      isAdministrator,
      isEditor,
      unsavedChanges,
      viewMode,
    } = this.state;

    return (
      <GridDashboardControls
        collapsedLayout={this.state.collapsedLayout}
        dashboardModel={dashboardModel}
        isAdministrator={isAdministrator}
        isEditor={isEditor}
        onResetDashboardFilters={this.onResetDashboardFilters}
        onAddTextItem={this.onAddTextItem}
        unsavedChanges={unsavedChanges}
        updateDashboardState={this.updateDashboardState}
        updateDashboardLastSavedState={this.updateDashboardLastSavedState}
        viewMode={viewMode}
      />
    );
  }

  render() {
    const { loaded, isEditQueryPanelVisible } = this.state;

    if (!loaded) {
      return this.renderLoader();
    }

    const innerClassName = classNames(
      'grid-dashboard-container__pushable',
      'grid-dashboard-container__inner',
      'min-full-page-height',
      {
        'grid-dashboard-container__pushable--pushed': isEditQueryPanelVisible,
      },
    );

    return (
      <div className="grid-dashboard-container min-full-page-height">
        {this.maybeRenderEditQueryPanel()}
        <div
          className={innerClassName}
          style={this.getInnerContainerStyle()}
          ref={this._pushedRef}
        >
          {this.renderControls()}
          {this.renderDashboard()}
        </div>
        {renderScrollToTop()}
      </div>
    );
  }
}

const GridDashboardApp = withScriptLoader(BaseGridDashboardApp, {
  scripts: [VENDOR_SCRIPTS.toastr, VENDOR_SCRIPTS.jsInterpreter],
});

export default GridDashboardApp;
