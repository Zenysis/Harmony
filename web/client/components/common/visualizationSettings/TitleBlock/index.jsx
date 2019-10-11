// @flow
import * as React from 'react';

import CompactTitleBlock from 'components/common/visualizationSettings/TitleBlock/CompactTitleBlock';
import ExpandedTitleBlock from 'components/common/visualizationSettings/TitleBlock/ExpandedTitleBlock';
import Modes from 'components/common/visualizationSettings/Modes';
import TitleSettings from 'models/core/QueryResultSpec/TitleSettings';
import type { Mode } from 'components/common/visualizationSettings/Modes';

export type TitleEvents = {
  onTitleSettingsChange: (settingType: string, value: any) => void,
};

type Props = TitleEvents & {
  titleSettings: TitleSettings,
  mode: Mode,
};

export default class TitleBlock extends React.PureComponent<Props> {
  render() {
    const TitleBlockComponent =
      this.props.mode === Modes.EXPANDED
        ? ExpandedTitleBlock
        : CompactTitleBlock;

    const { onTitleSettingsChange, titleSettings } = this.props;

    return (
      <TitleBlockComponent
        onTitleSettingsChange={onTitleSettingsChange}
        titleSettings={titleSettings}
      />
    );
  }
}
