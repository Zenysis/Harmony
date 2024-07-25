// @flow
import * as React from 'react';

import Button from 'components/ui/Button';
import Colors from 'components/ui/Colors';
import FallbackPill from 'components/ui/FallbackPill';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import InfoTooltip from 'components/ui/InfoTooltip';
import Moment from 'models/core/wip/DateTime/Moment';
import { DATE_TIME_FORMAT } from 'components/DataUploadApp/constants';
import { noop } from 'util/util';

const YELLOW_QUEUED_COLOR = '#ffe380';

type Props = {
  isSelfServeAdmin: boolean,
  lastPipelineRuntime?: Moment | void,
  loading?: boolean,
  nextPipelineRuntime?: Moment | void,
  onOpenModal?: () => void,
};

export default function HeaderBlock({
  isSelfServeAdmin,
  lastPipelineRuntime,
  loading = false,
  nextPipelineRuntime,
  onOpenModal = noop,
}: Props): React.Node {
  const maybeRenderAddSourceButton = () => {
    if (!isSelfServeAdmin) {
      return null;
    }
    return (
      <Button disabled={loading} onClick={onOpenModal} outline>
        <Icon style={{ marginRight: '12px' }} type="plus" />
        <I18N>Add source</I18N>
      </Button>
    );
  };

  const renderPipelineRuntimeInfo = (
    circleColor: string,
    labelText: string,
    runTime: Moment | void,
    infoText: string | void,
  ) => {
    let runtimeDisplay;
    if (loading) {
      runtimeDisplay = <FallbackPill height={20} width={100} />;
    } else if (runTime === undefined) {
      runtimeDisplay = (
        <span className="data-status-page__no-info">
          {I18N.text('No Information')}
        </span>
      );
    } else {
      runtimeDisplay = runTime.format(DATE_TIME_FORMAT);
    }

    return (
      <Group.Vertical
        alignItems="flex-end"
        firstItemClassName="data-status-page__caption"
        flex
        spacing="none"
      >
        <Group.Horizontal spacing="xs">
          <svg height="12" width="12">
            <circle
              cx="6"
              cy="6"
              fill={circleColor}
              r="5"
              stroke="#58585a"
              strokeWidth="1"
            />
          </svg>
          {labelText}
        </Group.Horizontal>
        <Group.Horizontal
          flex
          itemStyle={{ alignItems: 'center', display: 'flex' }}
          spacing="xs"
        >
          {infoText && (
            <InfoTooltip
              iconClassName="data-status-page__tooltip"
              text={infoText}
            />
          )}
          {runtimeDisplay}
        </Group.Horizontal>
      </Group.Vertical>
    );
  };

  return (
    <Group.Horizontal flex marginBottom="l" spacing="l">
      <Heading.Large>{I18N.textById('Data Upload')}</Heading.Large>
      {maybeRenderAddSourceButton()}
      <Group.Item flexValue={1}>
        {renderPipelineRuntimeInfo(
          YELLOW_QUEUED_COLOR,
          I18N.text('Estimated next pipeline completion'),
          nextPipelineRuntime,
          I18N.text(
            "This estimated time for the next pipeline completion is based on the average time between pipeline completions in the past. 'No Information' means that an estimate cannot be reliably calculated.",
            'dataUploadEstimatedRuntimeExplanation',
          ),
        )}
      </Group.Item>
      {renderPipelineRuntimeInfo(
        Colors.SUCCESS,
        I18N.text('Last successful pipeline completion'),
        lastPipelineRuntime,
      )}
    </Group.Horizontal>
  );
}
