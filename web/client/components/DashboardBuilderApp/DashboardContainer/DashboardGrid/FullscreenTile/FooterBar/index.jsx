// @flow
import * as React from 'react';

import ExitButton from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/FullscreenTile/FooterBar/ExitButton';
import Group from 'components/ui/Group';
import OptionsButton from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/FullscreenTile/FooterBar/OptionsButton';
import PaginationControls from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/FullscreenTile/FooterBar/PaginationControls';
import useAutoplayControl from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/FullscreenTile/FooterBar/hooks/useAutoplayControl';
import useKeyboardControls from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/FullscreenTile/FooterBar/hooks/useKeyboardControls';

type Props = {
  currentPage: number,
  numPages: number,
  onExitClick: () => void,
  onNextClick: () => void,
  onPreviousClick: () => void,
};

function FooterBar({
  currentPage,
  numPages,
  onExitClick,
  onNextClick,
  onPreviousClick,
}: Props) {
  const [autoplayDelay, setAutoplayDelay] = React.useState(30000);
  const [playing, onToggleAutoplay] = useAutoplayControl(
    onNextClick,
    autoplayDelay,
  );
  useKeyboardControls(
    onNextClick,
    onPreviousClick,
    onToggleAutoplay,
    onExitClick,
  );

  return (
    <Group.Horizontal
      alignItems="center"
      className="gd-fullscreen-tile__footer-bar"
      flex
      justifyContent="space-between"
      marginX="xl"
      marginY="l"
    >
      <OptionsButton
        autoplayDelay={autoplayDelay}
        onAutoplayDelayChange={setAutoplayDelay}
      />
      <PaginationControls
        currentPage={currentPage}
        numPages={numPages}
        onNextClick={onNextClick}
        onPreviousClick={onPreviousClick}
        onToggleAutoplay={onToggleAutoplay}
        playing={playing}
      />
      <ExitButton onClick={onExitClick} />
    </Group.Horizontal>
  );
}

export default (React.memo(FooterBar): React.AbstractComponent<Props>);
