// @flow
import * as React from 'react';

import ExpandedTimeline from 'components/visualizations/MapViz/QueryResultLayer/MapTimeline/ExpandedTimeline';
import TimelinePreview from 'components/visualizations/MapViz/QueryResultLayer/MapTimeline/TimelinePreview';
import buildPlaybackSpeed from 'components/visualizations/MapViz/QueryResultLayer/MapTimeline/buildPlaybackSpeed';
import useBoolean from 'lib/hooks/useBoolean';
import useInterval from 'components/visualizations/MapViz/QueryResultLayer/MapTimeline/useInterval';
import { TIMELINE_SPEED } from 'components/visualizations/MapViz/QueryResultLayer/MapTimeline/registry';
import type PlaybackSettings from 'models/visualizations/MapViz/PlaybackSettings';

type Props = {
  dateGrouping: string,
  dateIndex: number,
  dates: $ReadOnlyArray<string>,
  isHovering: boolean,
  onDateIndexChange: (dateIndex: number) => void,
  onPlaybackSettingsChange: PlaybackSettings => void,
  playbackSettings: PlaybackSettings,
};

/**
 * The MapTimeline is an overlay that allows the user to walk through a series
 * of dated map values.
 */
export default function MapTimeline({
  dateGrouping,
  dateIndex,
  dates,
  isHovering,
  onDateIndexChange,
  onPlaybackSettingsChange,
  playbackSettings,
}: Props): React.Node {
  const [playing, startPlaying, stopPlaying] = useBoolean(false);
  const [
    isSettingsModalOpen,
    openSettingsModal,
    hideSettingsModal,
  ] = useBoolean(false);
  const [isDateDropdownOpen, openDateDropdown, closeDateDropdown] = useBoolean(
    false,
  );
  const maxDateIndex = dates.length - 1;
  const playbackSpeed = buildPlaybackSpeed(
    playbackSettings.playbackSpeed(),
    TIMELINE_SPEED,
  );
  const reversePlayback = playbackSettings.reversePlayback();

  // HACK(nina): In order to respect the startFromMostRecentDate control,
  // we set up some useEffect hooks that will track and update the current
  // date index when it needs to change. Ideally, we would modify the dateIndex
  // prop before it gets passed into this component, but it is a state variable
  // that is used in other unrelated components as well. Since this is a
  // timeline-specific concept, I'd rather start with a hack here, then later
  // refactor QueryResultLayer (which does need love) to accomodate the change.
  const [currentDateIndex, setCurrentDateIndex] = React.useState(dateIndex);
  const startFromMostRecentDate = playbackSettings.startFromMostRecentDate();

  // When the startFromMostRecentDate control changes, we update the
  // current date index as necessary
  React.useEffect(() => {
    if (startFromMostRecentDate) {
      setCurrentDateIndex(maxDateIndex);
    } else {
      setCurrentDateIndex(0);
    }
  }, [maxDateIndex, startFromMostRecentDate]);

  // Regardless of the startFromMostRecentDate control, we need to update
  // currentDateIndex when dateIndex changes, which is what allows us to
  // actually traverse different dates' data
  React.useEffect(() => {
    setCurrentDateIndex(dateIndex);
  }, [dateIndex]);

  const [decrementIndex, incrementIndex, intervalIdRef] = useInterval();

  incrementIndex.current = () => {
    const newIndex =
      currentDateIndex >= maxDateIndex ? 0 : currentDateIndex + 1;
    onDateIndexChange(newIndex);
  };

  decrementIndex.current = () => {
    const newIndex =
      currentDateIndex <= 0 ? maxDateIndex : currentDateIndex - 1;
    onDateIndexChange(newIndex);
  };

  // Callback to determine which direction the timeline should step in
  const stepFunction = () =>
    reversePlayback ? decrementIndex.current() : incrementIndex.current();

  // Callback to start or stop timeline autoplay
  const togglePlaying = () => {
    if (playing) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = undefined;
      stopPlaying();
    } else {
      intervalIdRef.current = setInterval(stepFunction, playbackSpeed);
      startPlaying();
    }
  };

  // If a user changes the playback speed or direction while the timeline
  // is in autoplay, then we must update the set interval
  //
  // NOTE(nina): We only care about these changing controls WHEN the timeline
  // is already in autoplay. If the user has toggled the timeline to enter
  // autoplay mode, then togglePlaying() will handle setting the initial
  // interval. This is why we don't need to track the *playing* variable
  React.useEffect(() => {
    if (playing) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = setInterval(stepFunction, playbackSpeed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbackSpeed, reversePlayback]);

  function maybeRenderExpandedTimeline() {
    if (!isHovering && !isSettingsModalOpen && !isDateDropdownOpen) {
      return null;
    }

    return (
      <ExpandedTimeline
        closeDateDropdown={closeDateDropdown}
        dateGrouping={dateGrouping}
        dateIndex={currentDateIndex}
        dates={dates}
        decrementIndex={decrementIndex.current}
        hideSettingsModal={hideSettingsModal}
        incrementIndex={incrementIndex.current}
        isSettingsModalOpen={isSettingsModalOpen}
        maxDateIndex={maxDateIndex}
        onDateIndexChange={onDateIndexChange}
        onPlaybackSettingsChange={onPlaybackSettingsChange}
        openDateDropdown={openDateDropdown}
        openSettingsModal={openSettingsModal}
        playbackSettings={playbackSettings}
        playing={playing}
        togglePlaying={togglePlaying}
      />
    );
  }

  function maybeRenderTimelinePreview() {
    if (isHovering || isSettingsModalOpen || isDateDropdownOpen) {
      return null;
    }

    return (
      <TimelinePreview
        dateGrouping={dateGrouping}
        dateIndex={currentDateIndex}
        dates={dates}
        maxDateIndex={maxDateIndex}
      />
    );
  }

  return (
    <React.Fragment>
      {maybeRenderTimelinePreview()}
      {maybeRenderExpandedTimeline()}
    </React.Fragment>
  );
}
