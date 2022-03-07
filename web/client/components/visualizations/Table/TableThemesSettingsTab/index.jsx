// @flow
import * as React from 'react';

import BaseModal from 'components/ui/BaseModal';
import HeaderBar from 'components/visualizations/Table/TableThemesSettingsTab/HeaderBar';
import I18N from 'lib/I18N';
import ThemeCustomizer from 'components/visualizations/Table/TableThemesSettingsTab/ThemeCustomizer';
import ThemeSelector from 'components/visualizations/Table/TableThemesSettingsTab/ThemeSelector';
import useBoolean from 'lib/hooks/useBoolean';
import { CUSTOM_THEME_ID } from 'components/visualizations/Table/TableThemesSettingsTab/constants';
import { DEFAULT_THEME_MAP } from 'models/visualizations/Table/TableSettings/TableTheme/DefaultThemes';
import type TableTheme from 'models/visualizations/Table/TableSettings/TableTheme';
import type {
  DefaultThemeId,
  ThemeId,
} from 'models/visualizations/Table/TableSettings/TableTheme/DefaultThemes';
import type { TableColumn } from 'components/visualizations/Table/TableThemesSettingsTab/types';

type Props = {
  groupByColumns: $ReadOnlyArray<TableColumn>,
  onActiveThemeChange: string => void,
  onCustomThemeSelectAndUpdate: TableTheme => void,
  seriesColumns: $ReadOnlyArray<TableColumn>,
  showTotalThemeControls: boolean,
  activeThemeId: ThemeId,
  customTheme: TableTheme | void,
};

function TableThemesSettingsTab({
  activeThemeId,
  customTheme,
  groupByColumns,
  onActiveThemeChange,
  onCustomThemeSelectAndUpdate,
  seriesColumns,
  showTotalThemeControls,
}: Props): React.Node {
  const [
    isCustomizingTheme,
    showThemeCustomizer,
    closeThemeCustomizer,
  ] = useBoolean(false);

  const [
    showConfirmationModal,
    openConfirmationModal,
    closeConfirmationModal,
  ] = useBoolean(false);

  const createNewCustomTheme = () => {
    const newTheme =
      DEFAULT_THEME_MAP[((activeThemeId: $Cast): DefaultThemeId)];
    onCustomThemeSelectAndUpdate(newTheme);
  };

  const onConfirmCustomizeThemeClick = () => {
    createNewCustomTheme();
    closeConfirmationModal();
    showThemeCustomizer();
  };

  const onCustomizeThemeClick = () => {
    if (activeThemeId !== CUSTOM_THEME_ID && customTheme === undefined) {
      createNewCustomTheme();
      showThemeCustomizer();
    } else if (activeThemeId !== CUSTOM_THEME_ID) {
      openConfirmationModal();
    } else {
      showThemeCustomizer();
    }
  };

  const mainSection =
    isCustomizingTheme && customTheme !== undefined ? (
      <ThemeCustomizer
        groupByColumns={groupByColumns}
        onThemeChange={onCustomThemeSelectAndUpdate}
        seriesColumns={seriesColumns}
        theme={customTheme}
        showTotalThemeControls={showTotalThemeControls}
      />
    ) : (
      <ThemeSelector
        activeTheme={activeThemeId}
        customTheme={customTheme}
        onActiveThemeChange={onActiveThemeChange}
      />
    );

  const onHeaderButtonClick = isCustomizingTheme
    ? closeThemeCustomizer
    : onCustomizeThemeClick;

  return (
    <React.Fragment>
      <HeaderBar
        onButtonClick={onHeaderButtonClick}
        isCustomizingTheme={isCustomizingTheme}
        themeName={I18N.textById(activeThemeId)}
      />
      {mainSection}
      <BaseModal
        onPrimaryAction={onConfirmCustomizeThemeClick}
        onRequestClose={closeConfirmationModal}
        primaryButtonText={I18N.text('Continue')}
        show={showConfirmationModal}
        title={I18N.text('Continue?')}
        width={600}
      >
        <I18N>You will lose your existing custom theme</I18N>.
      </BaseModal>
    </React.Fragment>
  );
}

export default (React.memo<Props>(
  TableThemesSettingsTab,
): React.AbstractComponent<Props>);
