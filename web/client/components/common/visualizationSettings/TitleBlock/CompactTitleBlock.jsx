// @flow
import * as React from 'react';

import ControlsGroup from 'components/visualizations/common/controls/ControlsGroup';
import FontSizeControl from 'components/visualizations/common/controls/FontSizeControl';
import FontColorControl from 'components/visualizations/common/controls/FontColorControl';
import FontFamilyControl from 'components/visualizations/common/controls/FontFamilyControl';
import InputControl from 'components/visualizations/common/controls/InputControl';
import TitleSettings from 'models/core/QueryResultSpec/TitleSettings';
import type { TitleEvents } from 'components/common/visualizationSettings/TitleBlock';

const TEXT = t(
  'visualizations.common.SettingsModal.GeneralSettingsTab.TitleBlock',
);

type Props = TitleEvents & {
  titleSettings: TitleSettings,
};

export default class CompactTitleBlock extends React.PureComponent<Props> {
  // TODO(nina): Dropdown options are being covered by the collapsible panel
  renderCompactFontSizeControlGroup() {
    const { labels } = TEXT;

    const {
      titleFontSize,
      subtitleFontSize,
      titleFontColor,
      titleFontFamily,
    } = this.props.titleSettings.modelValues();

    return (
      <ControlsGroup>
        <FontSizeControl
          controlKey="titleFontSize"
          onValueChange={this.props.onTitleSettingsChange}
          value={titleFontSize}
          label={labels.titleFontSize}
          minFontSize={14}
          maxFontSize={32}
          colsWrapper={4}
          colsLabel={6}
          colsControl={6}
          className="compact-title-block__font-size-title-label"
        />
        <FontSizeControl
          controlKey="subtitleFontSize"
          onValueChange={this.props.onTitleSettingsChange}
          value={subtitleFontSize}
          label={labels.subtitleFontSize}
          minFontSize={10}
          maxFontSize={24}
          colsWrapper={4}
          colsLabel={7}
          colsControl={5}
          className="compact-title-block__font-size-subtitle-label"
        />
        <FontColorControl
          controlKey="titleFontColor"
          value={titleFontColor}
          onValueChange={this.props.onTitleSettingsChange}
          label={labels.titleFontColor}
          buttonMinWidth={115}
        />
        <FontFamilyControl
          controlKey="titleFontFamily"
          value={titleFontFamily}
          onValueChange={this.props.onTitleSettingsChange}
          label={labels.titleFontFamily}
          buttonMinWidth={115}
        />
      </ControlsGroup>
    );
  }

  renderCompactTitleControlGroup() {
    const { labels } = TEXT;
    return (
      <ControlsGroup>
        <InputControl
          controlKey="title"
          initialValue={this.props.titleSettings.title()}
          onValueChange={this.props.onTitleSettingsChange}
          label={labels.title}
          className="compact-title-block__title-control"
        />
      </ControlsGroup>
    );
  }

  renderCompactSubtitleControlGroup() {
    const { labels } = TEXT;
    return (
      <ControlsGroup>
        <InputControl
          controlKey="subtitle"
          onValueChange={this.props.onTitleSettingsChange}
          initialValue={this.props.titleSettings.subtitle()}
          label={labels.subtitle}
          className="compact-title-block__subtitle-control"
        />
      </ControlsGroup>
    );
  }

  render() {
    return (
      <div className="compact-title-block">
        {this.renderCompactFontSizeControlGroup()}
        {this.renderCompactTitleControlGroup()}
        {this.renderCompactSubtitleControlGroup()}
      </div>
    );
  }
}
