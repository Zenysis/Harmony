// @flow
import * as React from 'react';

import SettingsBlock from 'components/common/visualizationSettings/SettingsPage/SettingsBlock';
import SettingsPage from 'components/common/visualizationSettings/SettingsPage';
import TitleBlock from 'components/common/visualizationSettings/TitleBlock';
import type { EnabledGeneralSettingsConfig } from 'components/visualizations/common/SettingsModal/GeneralSettingsTab/defaults';

type DefaultProps = {
  controlsBlock: React.MixedElement | null,
};

type Props = {
  ...DefaultProps,
  ...React.ElementConfig<typeof TitleBlock>,
  enabledSettings: EnabledGeneralSettingsConfig,
};

const TEXT = t('visualizations.common.SettingsModal.GeneralSettingsTab');

export default class GeneralSettingsTab extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    controlsBlock: null,
  };

  maybeRenderDisplayOptionsSection(): React.Node {
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

  maybeRenderTitleSection(): React.Node {
    const { enabledSettings } = this.props;

    if (!enabledSettings.titleSettings) {
      return null;
    }

    return (
      <TitleBlock
        titleSettings={this.props.titleSettings}
        onTitleSettingsChange={this.props.onTitleSettingsChange}
      />
    );
  }

  render(): React.Node {
    return (
      <SettingsPage className="general-settings-tab">
        {this.maybeRenderDisplayOptionsSection()}
        {this.maybeRenderTitleSection()}
      </SettingsPage>
    );
  }
}
