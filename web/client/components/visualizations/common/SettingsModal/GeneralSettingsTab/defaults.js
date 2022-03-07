// @flow
import { RESULT_VIEW_TYPES } from 'components/QueryResult/viewTypes';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

// an object that stores which settings are enabled for this tab
// NOTE(nina): This is purely to hide/show the title settings block - but we
// could modify this to be more complex in the future.
export type EnabledGeneralSettingsConfig = {
  +titleSettings: boolean,
};

const DEFAULT_GENERAL_SETTINGS_OPTIONS: EnabledGeneralSettingsConfig = {
  titleSettings: true,
};

// eslint-disable-next-line import/prefer-default-export
export function getGeneralSettingsOptions(
  viewType: ResultViewType,
): EnabledGeneralSettingsConfig {
  switch (viewType) {
    case RESULT_VIEW_TYPES.NUMBER_TREND:
      return {
        ...DEFAULT_GENERAL_SETTINGS_OPTIONS,
        titleSettings: false,
      };
    default:
      return DEFAULT_GENERAL_SETTINGS_OPTIONS;
  }
}
