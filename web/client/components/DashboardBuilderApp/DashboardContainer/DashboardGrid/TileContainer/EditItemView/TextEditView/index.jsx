// @flow
import * as React from 'react';
import ReactDOM from 'react-dom';

import FullscreenEditContainer from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/EditItemView/FullscreenEditContainer';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import IconButton from 'components/ui/IconButton';
import LoadingSpinner from 'components/ui/LoadingSpinner';
import useElementSize from 'lib/hooks/useElementSize';
import { REFERENCE_FONT_SIZE } from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/TextTile';
import type DashboardTextItem from 'models/DashboardBuilderApp/DashboardItem/DashboardTextItem';
import type { TilePosition } from 'models/DashboardBuilderApp/DashboardItem/DashboardItemHolder';

type Props = {
  cellsPerRow: number,
  initialItem: DashboardTextItem,
  legacy: boolean,
  onRequestClose: () => void,
  onSaveClick: DashboardTextItem => void,
  position: TilePosition,
  scaleFactor: number,
  tileContainerId: string,
};

// NOTE(stephen): Lazily importing this module because it contains a giant
// dependency: the jodit-editor experience. We only need to load this JS code if
// the user actually starts editing the text tile.
const JoditEditor = React.lazy(() =>
  import(
    /* webpackChunkName: "asyncDashboardChunk" */
    'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/EditItemView/TextEditView/JoditEditor'
  ),
);

// This component will be rendered while React is fetching the JoditEditor
// component asynchronously.
// NOTE(stephen): This is a very rudimentary placeholder. It should not be
// displayed for very long.
const EDITOR_PLACEHOLDER = (
  <LoadingSpinner style={{ marginLeft: 12, marginTop: 12 }} />
);

/**
 * The TextEditView provides a rich text editor for the user to update the
 * custom text they want to display on the dashboard tile.
 */
function TextEditView({
  cellsPerRow,
  initialItem,
  legacy,
  onRequestClose,
  onSaveClick,
  position,
  scaleFactor,
  tileContainerId,
}: Props) {
  // NOTE(moriah): The JoditEditor handles updating the html text, and passes
  // in the new text onTextChange
  const [currentText, setCurrentText] = React.useState<string>(
    initialItem.text(),
  );
  const onSaveTextItemClick = React.useCallback(() => {
    onSaveClick(initialItem.text(currentText));
  }, [currentText, initialItem, onSaveClick]);

  const portalNode = React.useRef(document.createElement('div'));
  React.useEffect(() => {
    const node = portalNode.current;
    const gridLayout = document.getElementById('grid-layout');
    if (gridLayout) {
      gridLayout.appendChild(node);
    }
    return () => {
      if (gridLayout) {
        gridLayout.removeChild(node);
      }
    };
  }, [portalNode]);

  // Since we scale the text tile font by a scale factor and we are now
  // using a in-line text editor we need to also scale the font size that appears in
  // in the jodit container (texarea), so that it matches the TextTile.
  const config = React.useMemo(
    () => ({
      // HACK(stephen): Include the TextTile's className here so that the text
      // editing experience is consistent.
      inline: !legacy,
      editorCssClass: 'gd-dashboard-text-tile',
    }),
    [legacy],
  );

  const [{ height, width }, registerSizeElt] = useElementSize<HTMLDivElement>();
  const setRef = React.useCallback(
    elt => {
      registerSizeElt(elt);
    },
    [registerSizeElt],
  );

  const containerPosition = React.useMemo(() => {
    const gridLayoutElement = document.getElementById('grid-layout');
    const tileContainerElement = document.getElementById(tileContainerId);
    if (!tileContainerElement || !gridLayoutElement) {
      return null;
    }
    const layoutPosition = gridLayoutElement.getBoundingClientRect();
    const tileContainerPosition = tileContainerElement.getBoundingClientRect();
    return {
      width: tileContainerPosition.width,
      height: tileContainerPosition.height,
      top: tileContainerPosition.top - layoutPosition.top,
      left: tileContainerPosition.left - layoutPosition.left,
    };
  }, [tileContainerId]);

  // In inline text editing mode, we need to set the font size of the wrapper
  // div to the scaled value so that the contents of the Jodit textarea will
  // render with the correct scaled font size.
  const editorWrapperStyle = React.useMemo(
    () => ({
      fontSize: legacy ? undefined : REFERENCE_FONT_SIZE * scaleFactor,
      maxWidth: width,
    }),
    [legacy, scaleFactor, width],
  );

  const innerStyle = React.useMemo(
    () => ({
      display: 'flex',
      minHeight: height,
      width,
    }),
    [height, width],
  );

  const toolbarAlignment = React.useMemo(() => {
    if (position.x < (cellsPerRow / 8) * 3) {
      return 'left';
    }
    if (position.x + position.columnCount > (cellsPerRow / 8) * 5) {
      return 'right';
    }
    return 'center';
  }, [cellsPerRow, position]);

  if (legacy) {
    return (
      <FullscreenEditContainer
        onRequestClose={onRequestClose}
        onSaveClick={onSaveTextItemClick}
        title={I18N.text('Editing text')}
      >
        <React.Suspense fallback={EDITOR_PLACEHOLDER}>
          <JoditEditor
            config={config}
            onChange={setCurrentText}
            value={initialItem.text()}
          />
        </React.Suspense>
      </FullscreenEditContainer>
    );
  }

  const className = `gd-dashboard-text-edit-view gd-dashboard-text-edit-view--${toolbarAlignment}`;
  const iconButtonClassName = 'gd-dashboard-text-edit-view__icon_btn';

  return ReactDOM.createPortal(
    <React.Suspense fallback={EDITOR_PLACEHOLDER}>
      <div
        className={className}
        ref={setRef}
        style={{
          ...containerPosition,
          position: 'absolute',
          zIndex: 1000,
        }}
      >
        <div style={innerStyle}>
          <Group.Horizontal
            alignItems="center"
            className="gd-dashboard-text-edit-view__exit-menu"
            flex
            spacing="xxxs"
          >
            <IconButton
              className={`${iconButtonClassName} ${iconButtonClassName}--cancel`}
              onClick={onRequestClose}
              type="svg-cancel-outline"
            />
            <IconButton
              className={`${iconButtonClassName} ${iconButtonClassName}--save`}
              onClick={onSaveTextItemClick}
              type="svg-check-circle-outline"
            />
          </Group.Horizontal>
          <div
            className="gd-dashboard-text-edit-view__editor-wrapper"
            style={editorWrapperStyle}
          >
            <JoditEditor
              config={config}
              onChange={setCurrentText}
              value={initialItem.text()}
            />
          </div>
        </div>
      </div>
    </React.Suspense>,
    portalNode.current,
  );
}

export default (React.memo(TextEditView): React.AbstractComponent<Props>);
