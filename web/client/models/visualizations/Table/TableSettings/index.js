// @flow
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import TableTheme from 'models/visualizations/Table/TableSettings/TableTheme';
import { DEFAULT_THEME_MAP } from 'models/visualizations/Table/TableSettings/TableTheme/DefaultThemes';
import type GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type { IViewSpecificSettings } from 'models/visualizations/common/interfaces';
import type { Serializable } from 'lib/Zen';
import type { SortDirection } from 'components/ui/visualizations/Table/types';
import type { ThemeId } from 'models/visualizations/Table/TableSettings/TableTheme/DefaultThemes';
import type { VisualizationType } from 'models/AdvancedQueryApp/VisualizationType/types';

type DefaultValues = {
  activeTheme: ThemeId,
  addTotalRow: boolean,
  customTheme: TableTheme | void,
  enableCasePageLinking: boolean,
  enablePagination: boolean,
  fitWidth: boolean,
  footerBackground: string,
  footerBorderColor: string,
  footerColor: string,
  footerFontFamily: string,
  footerFontSize: string,
  headerBorderColor: string,
  invertedFields: $ReadOnlyArray<string>,
  maxColumnWidth: string,
  mergeTableCells: boolean,
  minColumnWidth: string,
  pivotedDimensions: $ReadOnlyArray<string>,
  rowHeight: number,
  tableFormat: 'table' | 'scorecard',
  userSort: {
    sortColumn: string,
    sortDirection: SortDirection,
  },
  wrapColumnTitles: boolean,
};

type SerializedTableSettings = {
  activeTheme: ThemeId,
  addTotalRow: boolean,
  customTheme: Zen.Serialized<TableTheme> | void,
  enableCasePageLinking: boolean,
  enablePagination: boolean,
  fitWidth: boolean,
  footerBackground: string,
  footerBorderColor: string,
  footerColor: string,
  footerFontFamily: string,
  footerFontSize: string,
  headerBorderColor: string,
  invertedFields: $ReadOnlyArray<string>,
  maxColumnWidth: string,
  mergeTableCells: boolean,
  minColumnWidth: string,
  rowHeight: number,
  tableFormat: 'table' | 'scorecard',
  // NOTE(sophie): this object isn't created automatically in the spec
  userSort: {
    sortColumn: string,
    sortDirection: SortDirection,
  } | void,
  wrapColumnTitles: boolean,
  // TODO (solo): Enable this setting
  // pivotedDimensions: $ReadOnlyArray<string>,
};

class TableSettings extends Zen.BaseModel<TableSettings, {}, DefaultValues>
  implements
    Serializable<SerializedTableSettings>,
    IViewSpecificSettings<TableSettings> {
  static defaultValues: DefaultValues = {
    activeTheme: 'Default',
    addTotalRow: false,
    customTheme: undefined,
    enableCasePageLinking: false,
    enablePagination: true,
    fitWidth: true,
    footerBackground: '#fff',
    footerBorderColor: '#fff',
    footerColor: 'black',
    footerFontFamily: 'Arial',
    footerFontSize: '13px',
    headerBorderColor: '#d9d9d9',
    invertedFields: [],
    maxColumnWidth: '500',
    mergeTableCells: false,
    minColumnWidth: '150',
    pivotedDimensions: [],
    rowHeight: 30,
    tableFormat: 'table',
    userSort: {
      sortColumn: '',
      sortDirection: 'ASC',
    },

    wrapColumnTitles: false,
  };

  static deserialize(
    values: SerializedTableSettings,
  ): Zen.Model<TableSettings> {
    const { customTheme, userSort, ...otherValues } = values;

    const deserializedTheme =
      customTheme === undefined || customTheme == null
        ? undefined
        : TableTheme.deserialize(customTheme);

    return TableSettings.create({
      ...otherValues,
      customTheme: deserializedTheme,
      userSort: userSort || {
        sortColumn: '',
        sortDirection: 'ASC',
      },
    });
  }

  serialize(): SerializedTableSettings {
    const customTheme = this._.customTheme();

    return {
      activeTheme: this._.activeTheme(),
      addTotalRow: this._.addTotalRow(),
      customTheme:
        customTheme === undefined ? undefined : customTheme.serialize(),
      enableCasePageLinking: this._.enableCasePageLinking(),
      enablePagination: this._.enablePagination(),
      fitWidth: this._.fitWidth(),
      footerBackground: this._.footerBackground(),
      footerBorderColor: this._.footerBorderColor(),
      footerColor: this._.footerColor(),
      footerFontFamily: this._.footerFontFamily(),
      footerFontSize: this._.footerFontSize(),
      headerBorderColor: this._.headerBorderColor(),
      invertedFields: this._.invertedFields(),
      maxColumnWidth: this._.maxColumnWidth(),
      mergeTableCells: this._.mergeTableCells(),
      minColumnWidth: this._.minColumnWidth(),
      rowHeight: this._.rowHeight(),
      tableFormat: this._.tableFormat(),
      userSort: {
        sortColumn: this._.userSort().sortColumn,
        sortDirection: this._.userSort().sortDirection,
      },
      wrapColumnTitles: this._.wrapColumnTitles(),

      // TODO(solo): Enable this setting
      // pivotedDimensions: this._.pivotedDimensions(),
    };
  }

  getTheme(): TableTheme {
    const activeTheme = this._.activeTheme();

    if (activeTheme === 'Custom') {
      const customTheme = this._.customTheme();

      invariant(
        customTheme instanceof TableTheme,
        '`customTheme` must exist if selected',
      );
      return customTheme;
    }

    return DEFAULT_THEME_MAP[activeTheme];
  }

  updatePivotedDimensionsFromNewGroupBySettings(
    groupingColumns: $ReadOnlySet<string>,
  ): Zen.Model<TableSettings> {
    const pivotedDimensions = this._.pivotedDimensions();

    const newPivotedDimensions = pivotedDimensions.filter(id =>
      groupingColumns.has(id),
    );
    return this._.pivotedDimensions(newPivotedDimensions);
  }

  updateFromNewGroupBySettings(
    newGroupBySettings: GroupBySettings,
  ): Zen.Model<TableSettings> {
    const customTheme = this._.customTheme();

    const groupingColumns = new Set(
      newGroupBySettings
        .groupings()
        .values()
        .map(grouping => grouping.id())
        // HACK: 'nation' is not real grouping dimension so cannot have any
        // grouping specific settings applied to it.
        .filter(groupingId => groupingId !== 'nation'),
    );

    if (customTheme === undefined) {
      return this.updatePivotedDimensionsFromNewGroupBySettings(
        groupingColumns,
      );
    }

    return this._.customTheme(
      customTheme.updateThemeFromNewGroupingColumns(groupingColumns),
    ).updatePivotedDimensionsFromNewGroupBySettings(groupingColumns);
  }

  updateFromNewSeriesSettings(
    newSeriesSettings: SeriesSettings,
  ): Zen.Model<TableSettings> {
    return this.updateInvertedFieldsFromNewSeriesSettings(
      newSeriesSettings,
    ).updateCustomThemeFromNewSeriesSettings(newSeriesSettings);
  }

  updateInvertedFieldsFromNewSeriesSettings(
    newSeriesSettings: SeriesSettings,
  ): Zen.Model<TableSettings> {
    const seriesOrder = newSeriesSettings.seriesOrder();
    const invertedFields = this._.invertedFields();

    const updatedInvertedFields = invertedFields.filter(fieldId =>
      seriesOrder.includes(fieldId),
    );

    if (updatedInvertedFields.length !== invertedFields.length) {
      return this._.invertedFields(updatedInvertedFields);
    }
    return this._;
  }

  updateCustomThemeFromNewSeriesSettings(
    newSeriesSettings: SeriesSettings,
  ): Zen.Model<TableSettings> {
    const customTheme = this._.customTheme();

    if (customTheme === undefined) {
      return this._;
    }

    const fieldColumns = new Set(newSeriesSettings.seriesOrder());

    return this._.customTheme(
      customTheme.updateThemeFromNewFieldColumns(fieldColumns),
    );
  }

  getTitleField(): void {
    return undefined;
  }

  changeToVisualizationType(
    vizType: VisualizationType,
  ): Zen.Model<TableSettings> {
    switch (vizType) {
      case 'TABLE':
        return this._.tableFormat('table');
      case 'TABLE_SCORECARD':
        return this._.tableFormat('scorecard');
      default:
        throw new Error('[TableSettings] Invalid Table visualization type');
    }
  }
}

export default ((TableSettings: $Cast): Class<Zen.Model<TableSettings>>);
