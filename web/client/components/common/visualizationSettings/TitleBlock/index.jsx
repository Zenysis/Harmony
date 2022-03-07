// @flow
import * as React from 'react';

import ColorControl from 'components/visualizations/common/controls/ColorControl';
import FontFamilyControl from 'components/visualizations/common/controls/FontFamilyControl';
import FontSizeControl from 'components/visualizations/common/controls/FontSizeControl';
import Group from 'components/ui/Group';
import InputControl from 'components/visualizations/common/controls/InputControl';
import SettingsBlock from 'components/common/visualizationSettings/SettingsPage/SettingsBlock';
import TitleSettings from 'models/core/QueryResultSpec/TitleSettings';

type Props = {
  onTitleSettingsChange: (settingType: string, value: any) => void,
  titleSettings: TitleSettings,
};

const TEXT = t(
  'visualizations.common.SettingsModal.GeneralSettingsTab.TitleBlock',
);

function TitleBlock({
  onTitleSettingsChange,
  titleSettings,
}: Props): React.Node {
  const { labels } = TEXT;
  const {
    title,
    titleFontSize,
    titleFontColor,
    titleFontFamily,
    subtitleFontSize,
    subtitle,
  } = titleSettings.modelValues();

  const fontSizeControlGroup = (
    <Group.Vertical spacing="l">
      <FontSizeControl
        controlKey="titleFontSize"
        ariaName={labels.titleFontSize}
        onValueChange={onTitleSettingsChange}
        value={titleFontSize}
        label={labels.titleFontSize}
        labelClassName="wrap-label-text"
        minFontSize={12}
        maxFontSize={27}
        buttonMinWidth={115}
      />
      <FontSizeControl
        controlKey="subtitleFontSize"
        ariaName={labels.subtitleFontSize}
        onValueChange={onTitleSettingsChange}
        value={subtitleFontSize}
        label={labels.subtitleFontSize}
        labelClassName="wrap-label-text"
        minFontSize={12}
        maxFontSize={27}
        buttonMinWidth={115}
      />
      <ColorControl
        controlKey="titleFontColor"
        enableNoColor={false}
        value={titleFontColor}
        onValueChange={onTitleSettingsChange}
        label={labels.titleFontColor}
        labelClassName="wrap-label-text"
      />
      <FontFamilyControl
        ariaName={labels.titleFontFamily}
        controlKey="titleFontFamily"
        value={titleFontFamily}
        onValueChange={onTitleSettingsChange}
        label={labels.titleFontFamily}
        labelClassName="wrap-label-text"
        buttonMinWidth={115}
      />
    </Group.Vertical>
  );

  const titleControlGroup = (
    <InputControl
      ariaName={labels.title}
      controlKey="title"
      initialValue={title}
      label={labels.title}
      onValueChange={onTitleSettingsChange}
      testId="settings-modal-title-control"
    />
  );

  const subtitleControlGroup = (
    <InputControl
      controlKey="subtitle"
      ariaName={labels.subtitle}
      onValueChange={onTitleSettingsChange}
      initialValue={subtitle}
      label={labels.subtitle}
    />
  );

  return (
    <SettingsBlock className="title-section" title={TEXT.heading}>
      <Group.Vertical spacing="l">
        {fontSizeControlGroup}
        {titleControlGroup}
        {subtitleControlGroup}
      </Group.Vertical>
    </SettingsBlock>
  );
}

export default (React.memo(TitleBlock): React.AbstractComponent<Props>);
