// @flow
import * as React from 'react';

import Dropdown from 'components/ui/Dropdown';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import InputSlider from 'components/visualizations/MapViz/QueryResultLayer/MapTimeline/InputSlider';
import Popover from 'components/ui/Popover';
import RadioGroup from 'components/ui/RadioGroup';
import ToggleSwitch from 'components/ui/ToggleSwitch';
import Tooltip from 'components/ui/Tooltip';
import useBoolean from 'lib/hooks/useBoolean';
import {
  CIRCLE_DIAMETER,
  TEXT_WIDTH_VALUES,
  TIMELINE_WIDTH,
  TIMELINE_HORIZONTAL_PADDING,
} from 'components/visualizations/MapViz/QueryResultLayer/MapTimeline/registry';
import type PlaybackSettings from 'models/visualizations/MapViz/PlaybackSettings';
import type { IconType } from 'components/ui/Icon/types';

type Props = {
  closeDateDropdown: () => void,
  dateGrouping: string,
  dateIndex: number,
  dates: $ReadOnlyArray<string>,
  decrementIndex: () => void,
  hideSettingsModal: () => void,
  incrementIndex: () => void,
  isSettingsModalOpen: boolean,
  maxDateIndex: number,
  onDateIndexChange: (dateIndex: number) => void,
  onPlaybackSettingsChange: PlaybackSettings => void,
  openDateDropdown: () => void,
  openSettingsModal: () => void,
  playbackSettings: PlaybackSettings,
  playing: boolean,
  togglePlaying: () => void,
};

function renderButton(
  dimensionSize: number,
  iconType: IconType,
  onClick: () => void,
) {
  return (
    <Icon
      className="query-result-timeline__icon-button"
      onClick={onClick}
      style={{ height: dimensionSize, width: dimensionSize }}
      type={iconType}
    />
  );
}

export default function ExpandedTimeline({
  closeDateDropdown,
  dateGrouping,
  dateIndex,
  dates,
  decrementIndex,
  hideSettingsModal,
  incrementIndex,
  isSettingsModalOpen,
  maxDateIndex,
  onDateIndexChange,
  onPlaybackSettingsChange,
  openDateDropdown,
  openSettingsModal,
  playbackSettings,
  playing,
  togglePlaying,
}: Props): React.Node {
  const [
    isHoveringOverDateDropdown,
    hoverOverDateDropdown,
    hoverOutOfDateDropdown,
  ] = useBoolean(false);

  const [
    settingsButtonElt,
    setSettingsButtonElt,
  ] = React.useState<?HTMLDivElement>(undefined);
  const settingsButtonAnchorRef = React.useRef();

  React.useEffect(() => {
    if (settingsButtonAnchorRef.current) {
      setSettingsButtonElt(settingsButtonAnchorRef.current);
    }
  }, [settingsButtonAnchorRef]);

  function renderSettingsModal() {
    return (
      <Popover
        anchorElt={settingsButtonElt}
        anchorOrigin={Popover.Origins.TOP_CENTER}
        isOpen={isSettingsModalOpen}
        onRequestClose={hideSettingsModal}
        popoverOrigin={Popover.Origins.BOTTOM_LEFT}
      >
        <Group.Vertical>
          <Group.Vertical>
            {I18N.text('Playback speed')}
            <RadioGroup
              value={playbackSettings.playbackSpeed()}
              onChange={val =>
                onPlaybackSettingsChange(playbackSettings.playbackSpeed(val))
              }
              direction="vertical"
            >
              <RadioGroup.Item value="quarter">0.25</RadioGroup.Item>
              <RadioGroup.Item value="half">0.5</RadioGroup.Item>
              <RadioGroup.Item value="normal">
                {I18N.text('Normal')}
              </RadioGroup.Item>
              <RadioGroup.Item value="double">2</RadioGroup.Item>
              <RadioGroup.Item value="quadruple">4</RadioGroup.Item>
            </RadioGroup>
          </Group.Vertical>
          <Group.Vertical>
            {I18N.text('Playback direction')}
            <ToggleSwitch
              displayLabels="right"
              label={I18N.text('Play in reverse')}
              onChange={() =>
                onPlaybackSettingsChange(
                  playbackSettings.reversePlayback(
                    !playbackSettings.reversePlayback(),
                  ),
                )
              }
              value={playbackSettings.reversePlayback()}
            />
          </Group.Vertical>
        </Group.Vertical>
      </Popover>
    );
  }

  // TODO(nina): There is a bug where the window will register that a user
  // is not focused on the map immediately after the Popover component
  // triggers its onRequestClose() callback. This means that the expanded
  // timeline will be swapped out for the timeline preview until the user
  // focuses on the map again. We need to fix this somehow
  function renderButtonControls() {
    return (
      <React.Fragment>
        <Group.Horizontal
          flex
          alignItems="center"
          className="query-result-timeline__button-container"
          justifyContent="space-between"
          spacing="none"
        >
          {/** HACK(nina): Render a hidden icon so that the play button
           * controls can properly be centered */}
          <Icon type="svg-settings-outline" style={{ visibility: 'hidden' }} />
          <Group.Item flex alignItems="center">
            <Tooltip content={I18N.text('Step Back')} tooltipPlacement="top">
              {renderButton(24, 'svg-skip-previous', decrementIndex)}
            </Tooltip>
            <Tooltip
              popoverClassName="query-result-timeline-play-button-tooltip"
              content={!playing ? I18N.text('Play') : I18N.text('Pause')}
              tooltipPlacement="top"
            >
              {renderButton(
                40,
                !playing ? 'svg-play' : 'svg-pause',
                togglePlaying,
              )}
            </Tooltip>
            <Tooltip content={I18N.text('Step Forward')} tooltipPlacement="top">
              {renderButton(24, 'svg-skip-next', incrementIndex)}
            </Tooltip>
          </Group.Item>
          <div style={{ marginBottom: '-4px' }} ref={settingsButtonAnchorRef}>
            {renderButton(16, 'svg-settings-outline', openSettingsModal)}
          </div>
        </Group.Horizontal>
        {renderSettingsModal()}
      </React.Fragment>
    );
  }

  // TODO(nina): There is a bug where the window will register that a user
  // is not focused on the map immediately after the Dropdown component
  // triggers its onDropdownClose() callback. This means that the expanded
  // timeline will be swapped out for the timeline preview until the user
  // focuses on the map again. We need to fix this somehow
  function renderMinMaxDates() {
    return (
      <Group.Horizontal flex justifyContent="space-between" marginRight="xxxs">
        <div
          onMouseOver={hoverOverDateDropdown}
          onMouseOut={hoverOutOfDateDropdown}
        >
          <Dropdown
            buttonClassName="query-result-timeline__dropdown-button"
            hideCaret={!isHoveringOverDateDropdown}
            onDropdownClose={closeDateDropdown}
            onOpenDropdownClick={openDateDropdown}
            onSelectionChange={onDateIndexChange}
            value={dateIndex}
            valueStyle={{ width: TEXT_WIDTH_VALUES[dateGrouping] || 50 }}
          >
            {dates.map((date, idx) => (
              <Dropdown.Option value={idx} key={date}>
                {date}
              </Dropdown.Option>
            ))}
          </Dropdown>
        </div>
        <span className="query-result-timeline__end-date">
          {dates[maxDateIndex] || ''}
        </span>
      </Group.Horizontal>
    );
  }

  // NOTE(nina): The width passed into InputSlider is a width that represents
  // the entire width of the container, without the horizontal padding and
  // accounting for the diameter of the thumb (which is a circle wrapped in a
  // draggable item). This allows us to build a slider that fits exactly the
  // width left in the container, while also shrinking it enough that we can
  // properly draw it under the thumb (which is a draggable item).
  return (
    <Group.Vertical
      flex
      alignItems="center"
      className="query-result-timeline hide-on-export"
      style={{
        paddingLeft: TIMELINE_HORIZONTAL_PADDING,
        paddingRight: TIMELINE_HORIZONTAL_PADDING,
        width: TIMELINE_WIDTH,
      }}
      itemStyle={{ width: '100%' }}
    >
      <Group.Item marginBottom="xs">{renderButtonControls()}</Group.Item>
      <InputSlider
        currentIndex={dateIndex}
        maxDateIndex={maxDateIndex}
        onCurrentIndexChange={onDateIndexChange}
        values={dates}
        width={
          TIMELINE_WIDTH - 2 * TIMELINE_HORIZONTAL_PADDING - CIRCLE_DIAMETER
        }
      />
      {renderMinMaxDates()}
    </Group.Vertical>
  );
}
