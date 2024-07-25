// @flow
import * as React from 'react';

import Group from 'components/ui/Group';
import IconButton from 'components/ui/IconButton';

type Props = {
  currentPage: number,
  numPages: number,
  onNextClick: () => void,
  onPreviousClick: () => void,
  onToggleAutoplay: () => void,
  playing: boolean,
};

function PaginationControls({
  currentPage,
  numPages,
  onNextClick,
  onPreviousClick,
  onToggleAutoplay,
  playing,
}: Props) {
  const autoplayIcon = playing ? 'pause' : 'play';
  return (
    <Group.Horizontal spacing="s">
      <IconButton
        ariaName="play"
        className="gd-fullscreen-tile__button"
        onClick={onToggleAutoplay}
        type={autoplayIcon}
      />
      <IconButton
        ariaName="previous"
        className="gd-fullscreen-tile__button"
        onClick={onPreviousClick}
        type="arrow-left"
      />
      <span>
        {currentPage}/{numPages}
      </span>
      <IconButton
        ariaName="next"
        className="gd-fullscreen-tile__button"
        onClick={onNextClick}
        type="arrow-right"
      />
    </Group.Horizontal>
  );
}

export default (React.memo(PaginationControls): React.AbstractComponent<Props>);
