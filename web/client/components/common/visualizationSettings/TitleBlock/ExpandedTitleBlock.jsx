// @flow
import * as React from 'react';

import ControlsGroup from 'components/visualizations/common/controls/ControlsGroup';
import FontSizeControl from 'components/visualizations/common/controls/FontSizeControl';
import FontColorControl from 'components/visualizations/common/controls/FontColorControl';
import FontFamilyControl from 'components/visualizations/common/controls/FontFamilyControl';
import InputControl from 'components/visualizations/common/controls/InputControl';
import SettingsBlock from 'components/common/visualizationSettings/SettingsPage/SettingsBlock';
import TitleSettings from 'models/core/QueryResultSpec/TitleSettings';
import type { TitleEvents } from 'components/common/visualizationSettings/TitleBlock';

const TEXT = t(
  'visualizations.common.SettingsModal.GeneralSettingsTab.TitleBlock',
);

type Props = TitleEvents & {
  titleSettings: TitleSettings,
};

export default class ExpandedTitleBlock extends React.PureComponent<Props> {
  renderExpandedFontSizeControlGroup() {
    const { labels } = TEXT;

    const {
      titleFontSize,
      subtitleFontSize,
      titleFontColor,
      titleFontFamily,
    } = this.props.titleSettings.modelValues();

    return (
      <React.Fragment>
        <ControlsGroup>
          <FontSizeControl
            controlKey="titleFontSize"
            onValueChange={this.props.onTitleSettingsChange}
            value={titleFontSize}
            label={labels.titleFontSize}
            minFontSize={14}
            maxFontSize={32}
            colsWrapper={6}
            colsLabel={6}
            colsControl={6}
            buttonMinWidth={115}
          />
        </ControlsGroup>
        <ControlsGroup>
          <FontSizeControl
            controlKey="subtitleFontSize"
            onValueChange={this.props.onTitleSettingsChange}
            value={subtitleFontSize}
            label={labels.subtitleFontSize}
            minFontSize={10}
            maxFontSize={24}
            colsWrapper={6}
            colsLabel={6}
            colsControl={6}
            buttonMinWidth={115}
          />
        </ControlsGroup>
        <ControlsGroup>
          <FontColorControl
            controlKey="titleFontColor"
            value={titleFontColor}
            onValueChange={this.props.onTitleSettingsChange}
            label={labels.titleFontColor}
            buttonMinWidth={115}
          />
        </ControlsGroup>
        <ControlsGroup>
          <FontFamilyControl
            controlKey="titleFontFamily"
            value={titleFontFamily}
            onValueChange={this.props.onTitleSettingsChange}
            label={labels.titleFontFamily}
            buttonMinWidth={115}
          />
        </ControlsGroup>
      </React.Fragment>
    );
  }

  renderExpandedTitleControlGroup() {
    const { labels } = TEXT;
    return (
      <ControlsGroup>
        <InputControl
          controlKey="title"
          initialValue={this.props.titleSettings.title()}
          onValueChange={this.props.onTitleSettingsChange}
          label={labels.title}
          colsWrapper={12}
          colsLabel={3}
          colsControl={9}
        />
      </ControlsGroup>
    );
  }

  renderExpandedSubtitleControlGroup() {
    const { labels } = TEXT;
    return (
      <ControlsGroup>
        <InputControl
          controlKey="subtitle"
          onValueChange={this.props.onTitleSettingsChange}
          initialValue={this.props.titleSettings.subtitle()}
          label={labels.subtitle}
          colsWrapper={12}
          colsLabel={3}
          colsControl={9}
        />
      </ControlsGroup>
    );
  }

  render() {
    return (
      <SettingsBlock className="title-section" title={TEXT.heading}>
        {this.renderExpandedFontSizeControlGroup()}
        {this.renderExpandedTitleControlGroup()}
        {this.renderExpandedSubtitleControlGroup()}
      </SettingsBlock>
    );
  }
}
