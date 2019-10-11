// @flow
import * as React from 'react';

import Modes from 'components/common/visualizationSettings/Modes';
import SettingsBlock from 'components/common/visualizationSettings/SettingsPage/SettingsBlock';
import SettingsPage from 'components/common/visualizationSettings/SettingsPage';
import TitleBlock from 'components/common/visualizationSettings/TitleBlock';
import type { TitleEvents } from 'components/common/visualizationSettings/TitleBlock';

export type GeneralSettingsEvents = TitleEvents;

type Props = React.ElementProps<typeof TitleBlock> & {
  controlsBlock: React.Element<any>,
};

const TEXT = t('visualizations.common.SettingsModal.GeneralSettingsTab');

export default class GeneralSettingsTab extends React.PureComponent<Props> {
  static defaultProps = {
    controlsBlock: null,
  };

  static eventNames: Array<$Keys<GeneralSettingsEvents>> = [
    'onTitleSettingsChange',
  ];

  maybeRenderDisplayOptionsSection() {
    const { controlsBlock } = this.props;
    if (controlsBlock) {
      return (
        <SettingsBlock
          className="controls-section"
          title={TEXT.displayOptionsHeader}
        >
          {controlsBlock}
        </SettingsBlock>
      );
    }

    return null;
  }

  renderTitleSection() {
    return (
      <TitleBlock
        titleSettings={this.props.titleSettings}
        onTitleSettingsChange={this.props.onTitleSettingsChange}
        mode={Modes.EXPANDED}
      />
    );
  }

  render() {
    return (
      <SettingsPage className="general-settings-tab">
        {this.maybeRenderDisplayOptionsSection()}
        {this.renderTitleSection()}
      </SettingsPage>
    );
  }
}
