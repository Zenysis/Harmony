// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import GoalLineControl from 'components/visualizations/BarGraph/BarGraphControlsBlock/GoalLineControl';
import Heading from 'components/ui/Heading';
import InfoTooltip from 'components/ui/InfoTooltip';
import RemoveItemButton from 'components/ui/RemoveItemButton';
import Spacing from 'components/ui/Spacing';
import { createGoalLineObject } from 'components/ui/visualizations/BarGraph/internal/createGoalLineObject';
import type { GoalLineData } from 'components/ui/visualizations/common/MetricAxis/types';

type Props = {
  goalLines: Zen.Array<GoalLineData>,
  onGoalLinesChange: (Zen.Array<GoalLineData>) => void,
};

const GOAL_LINE_TEXT = t(
  'visualizations.common.SettingsModal.GeneralSettingsTab.GoalLineSection',
);

export default function GoalLineControlsBlock({
  goalLines,
  onGoalLinesChange,
}: Props): React.Node {
  const [collapsed, setCollapsed] = React.useState(true);
  const noGoalLinesDefined = goalLines.isEmpty();

  React.useEffect(() => {
    if (noGoalLinesDefined) {
      setCollapsed(true);
    }
  }, [noGoalLinesDefined]);

  const onGoalLineAdd = React.useCallback(() => {
    onGoalLinesChange(goalLines.push(createGoalLineObject({})));
  }, [goalLines, onGoalLinesChange]);

  const onGoalLineChange = React.useCallback(
    goalLine => {
      const idx = goalLines.findIndex(line => line.id === goalLine.id);
      if (idx >= 0) {
        onGoalLinesChange(goalLines.set(idx, goalLine));
      }
    },
    [goalLines, onGoalLinesChange],
  );

  const onGoalLineRemove = React.useCallback(
    id => {
      onGoalLinesChange(goalLines.findAndDelete(line => line.id === id));
    },
    [goalLines, onGoalLinesChange],
  );

  const onTitleIconClick = React.useCallback(() => {
    if (!collapsed || noGoalLinesDefined) {
      onGoalLineAdd();
      setCollapsed(false);
    } else {
      setCollapsed(!collapsed);
    }
  }, [collapsed, noGoalLinesDefined, onGoalLineAdd]);

  function renderTitle() {
    return (
      <div className="goal-lines-section__title-section">
        <Heading size={Heading.Sizes.SMALL}>
          {GOAL_LINE_TEXT.goalLineHeader}
        </Heading>
        <div
          className="goal-lines-section__icon-wrapper"
          onClick={onTitleIconClick}
          role="button"
        >
          <InfoTooltip
            iconType={collapsed ? 'edit' : 'plus-sign'}
            text={
              collapsed ? GOAL_LINE_TEXT.editButton : GOAL_LINE_TEXT.addButton
            }
            tooltipPlacement="top"
          />
        </div>
      </div>
    );
  }

  function maybeRenderGoalLines() {
    if (collapsed) {
      return null;
    }

    return (
      <Spacing className="goal-lines-section__contents" marginTop="xs">
        {goalLines.mapValues(line => (
          <div className="goal-lines-section__row" key={line.id}>
            <GoalLineControl
              goalLine={line}
              onGoalLineSettingsChange={onGoalLineChange}
            />
            <RemoveItemButton onClick={() => onGoalLineRemove(line.id)} />
          </div>
        ))}
      </Spacing>
    );
  }

  return (
    <React.Fragment>
      {renderTitle()}
      {maybeRenderGoalLines()}
    </React.Fragment>
  );
}
