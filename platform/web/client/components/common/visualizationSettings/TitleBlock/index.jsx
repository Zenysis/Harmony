// @flow
import * as React from 'react';

import ColorControl from 'components/visualizations/common/controls/ColorControl';
import FontFamilyControl from 'components/visualizations/common/controls/FontFamilyControl';
import FontSizeControl from 'components/visualizations/common/controls/FontSizeControl';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import InputControl from 'components/visualizations/common/controls/InputControl';
import SettingsBlock from 'components/common/visualizationSettings/SettingsPage/SettingsBlock';
import TitleSettings from 'models/core/QueryResultSpec/TitleSettings';

type Props = {
  onTitleSettingsChange: (settingType: string, value: any) => void,
  titleSettings: TitleSettings,
};

function TitleBlock({
  onTitleSettingsChange,
  titleSettings,
}: Props): React.Node {
  const {
    subtitle,
    subtitleFontSize,
    title,
    titleFontColor,
    titleFontFamily,
    titleFontSize,
  } = titleSettings.modelValues();

  const fontSizeControlGroup = (
    <Group.Vertical spacing="l">
      <FontSizeControl
        ariaName={I18N.textById('Title font size')}
        buttonMinWidth={115}
        controlKey="titleFontSize"
        label={I18N.textById('Title font size')}
        labelClassName="wrap-label-text"
        maxFontSize={27}
        minFontSize={12}
        onValueChange={onTitleSettingsChange}
        value={titleFontSize}
      />
      <FontSizeControl
        ariaName={I18N.text('Subtitle font size')}
        buttonMinWidth={115}
        controlKey="subtitleFontSize"
        label={I18N.textById('Subtitle font size')}
        labelClassName="wrap-label-text"
        maxFontSize={27}
        minFontSize={12}
        onValueChange={onTitleSettingsChange}
        value={subtitleFontSize}
      />
      <ColorControl
        controlKey="titleFontColor"
        enableNoColor={false}
        label={I18N.textById('Title font color')}
        labelClassName="wrap-label-text"
        onValueChange={onTitleSettingsChange}
        value={titleFontColor}
      />
      <FontFamilyControl
        ariaName={I18N.textById('Title font')}
        buttonMinWidth={115}
        controlKey="titleFontFamily"
        label={I18N.textById('Title font')}
        labelClassName="wrap-label-text"
        onValueChange={onTitleSettingsChange}
        value={titleFontFamily}
      />
    </Group.Vertical>
  );

  const titleControlGroup = (
    <InputControl
      ariaName={I18N.textById('Title')}
      controlKey="title"
      initialValue={title}
      label={I18N.textById('Title')}
      onValueChange={onTitleSettingsChange}
      testId="settings-modal-title-control"
    />
  );

  const subtitleControlGroup = (
    <InputControl
      ariaName={I18N.text('Subtitle')}
      controlKey="subtitle"
      initialValue={subtitle}
      label={I18N.textById('Subtitle')}
      onValueChange={onTitleSettingsChange}
    />
  );

  return (
    <SettingsBlock className="title-section" title={I18N.textById('Title')}>
      <Group.Vertical spacing="l">
        {fontSizeControlGroup}
        {titleControlGroup}
        {subtitleControlGroup}
      </Group.Vertical>
    </SettingsBlock>
  );
}

export default (React.memo(TitleBlock): React.AbstractComponent<Props>);
