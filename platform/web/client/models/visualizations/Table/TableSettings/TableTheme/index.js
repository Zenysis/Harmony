// @flow
import * as Zen from 'lib/Zen';
import ColumnTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/ColumnTheme';
import GridlinesTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/GridlinesTheme';
import HeaderColumnwiseTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/HeaderColumnwiseTheme';
import HeaderGeneralTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/HeaderGeneralTheme';
import LegendTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/LegendTheme';
import TableStyleTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/TableStyleTheme';
import TotalTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/TotalTheme';
import WorksheetTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/WorksheetTheme';
import { COLUMN_TYPE } from 'components/visualizations/Table/constants';
import {
  deserializePerColumnTheme,
  serializePerColumnTheme,
} from 'models/visualizations/Table/TableSettings/TableTheme/serializationUtil';
import type { ColumnType } from 'components/visualizations/Table/constants';
import type {
  PerColumnTheme,
  SerializedPerColumnTheme,
  Theme,
} from 'models/visualizations/Table/TableSettings/TableTheme/types';
import type { Serializable } from 'lib/Zen';

function getNewPerColumnThemeFromNewColumns<T: Theme>(
  theme: PerColumnTheme<T>,
  defaultTheme: T,
  columns: $ReadOnlySet<string>,
): PerColumnTheme<T> {
  if (!theme.isPerColumn) {
    return theme;
  }

  const newTheme = { ...theme };

  // Delete any columns from the theme map that no longer exist
  theme.map.keys().forEach(existingColumn => {
    if (!columns.has(existingColumn)) {
      newTheme.map = newTheme.map.delete(existingColumn);
    }
  });

  // Add any new columns to the theme map
  columns.forEach(newColumn => {
    if (!newTheme.map.has(newColumn)) {
      newTheme.map = newTheme.map.set(newColumn, defaultTheme);
    }
  });

  return newTheme;
}

type DefaultValues = {
  fieldsColumnTheme: PerColumnTheme<ColumnTheme>,
  fieldsHeaderColumnwiseTheme: PerColumnTheme<HeaderColumnwiseTheme>,
  fieldsWorksheetTheme: PerColumnTheme<WorksheetTheme>,
  gridlinesTheme: GridlinesTheme,
  groupingsColumnTheme: PerColumnTheme<ColumnTheme>,
  groupingsHeaderColumnwiseTheme: PerColumnTheme<HeaderColumnwiseTheme>,
  groupingsWorksheetTheme: PerColumnTheme<WorksheetTheme>,
  headerGeneralTheme: HeaderGeneralTheme,
  legendTheme: LegendTheme,
  tableStyleTheme: TableStyleTheme,
  totalTheme: TotalTheme,
};

type SerializedTableTheme = {
  fieldsColumnTheme: SerializedPerColumnTheme<ColumnTheme>,
  fieldsHeaderColumnwiseTheme: SerializedPerColumnTheme<HeaderColumnwiseTheme>,
  fieldsWorksheetTheme: SerializedPerColumnTheme<WorksheetTheme>,
  gridlinesTheme: Zen.Serialized<GridlinesTheme>,
  groupingsColumnTheme: SerializedPerColumnTheme<ColumnTheme>,
  groupingsHeaderColumnwiseTheme: SerializedPerColumnTheme<HeaderColumnwiseTheme>,
  groupingsWorksheetTheme: SerializedPerColumnTheme<WorksheetTheme>,
  headerGeneralTheme: Zen.Serialized<HeaderGeneralTheme>,
  tableStyleTheme: Zen.Serialized<TableStyleTheme>,
  totalTheme: Zen.Serialized<TotalTheme>,
};

class TableTheme extends Zen.BaseModel<TableTheme, {}, DefaultValues>
  implements Serializable<SerializedTableTheme> {
  static defaultValues: DefaultValues = {
    fieldsColumnTheme: ColumnTheme.createAsPerColumnTheme({}),
    fieldsHeaderColumnwiseTheme: HeaderColumnwiseTheme.createAsPerColumnTheme(
      {},
    ),
    fieldsWorksheetTheme: WorksheetTheme.createAsPerColumnTheme({}),
    gridlinesTheme: GridlinesTheme.create({}),
    groupingsColumnTheme: ColumnTheme.createAsPerColumnTheme({}),
    groupingsHeaderColumnwiseTheme: HeaderColumnwiseTheme.createAsPerColumnTheme(
      {},
    ),
    groupingsWorksheetTheme: WorksheetTheme.createAsPerColumnTheme({}),
    headerGeneralTheme: HeaderGeneralTheme.create({}),
    legendTheme: LegendTheme.create({}),
    tableStyleTheme: TableStyleTheme.create({}),
    totalTheme: TotalTheme.create({}),
  };

  static deserialize(values: SerializedTableTheme): Zen.Model<TableTheme> {
    const {
      fieldsColumnTheme,
      fieldsHeaderColumnwiseTheme,
      fieldsWorksheetTheme,
      gridlinesTheme,
      groupingsColumnTheme,
      groupingsHeaderColumnwiseTheme,
      groupingsWorksheetTheme,
      headerGeneralTheme,
      tableStyleTheme,
      totalTheme,
    } = values;

    return TableTheme.create({
      fieldsColumnTheme: deserializePerColumnTheme(
        ColumnTheme,
        fieldsColumnTheme,
      ),
      fieldsHeaderColumnwiseTheme: deserializePerColumnTheme(
        HeaderColumnwiseTheme,
        fieldsHeaderColumnwiseTheme,
      ),
      fieldsWorksheetTheme: deserializePerColumnTheme(
        WorksheetTheme,
        fieldsWorksheetTheme,
      ),
      gridlinesTheme: GridlinesTheme.deserialize(gridlinesTheme),
      groupingsColumnTheme: deserializePerColumnTheme(
        ColumnTheme,
        groupingsColumnTheme,
      ),
      groupingsHeaderColumnwiseTheme: deserializePerColumnTheme(
        HeaderColumnwiseTheme,
        groupingsHeaderColumnwiseTheme,
      ),
      groupingsWorksheetTheme: deserializePerColumnTheme(
        WorksheetTheme,
        groupingsWorksheetTheme,
      ),
      headerGeneralTheme: HeaderGeneralTheme.deserialize(headerGeneralTheme),
      tableStyleTheme: TableStyleTheme.deserialize(tableStyleTheme),
      totalTheme: TotalTheme.deserialize(totalTheme),
    });
  }

  serialize(): SerializedTableTheme {
    return {
      fieldsColumnTheme: serializePerColumnTheme(this._.fieldsColumnTheme()),
      fieldsHeaderColumnwiseTheme: serializePerColumnTheme(
        this._.fieldsHeaderColumnwiseTheme(),
      ),
      fieldsWorksheetTheme: serializePerColumnTheme(
        this._.fieldsWorksheetTheme(),
      ),
      gridlinesTheme: this._.gridlinesTheme().serialize(),
      groupingsColumnTheme: serializePerColumnTheme(
        this._.groupingsColumnTheme(),
      ),
      groupingsHeaderColumnwiseTheme: serializePerColumnTheme(
        this._.groupingsHeaderColumnwiseTheme(),
      ),
      groupingsWorksheetTheme: serializePerColumnTheme(
        this._.groupingsWorksheetTheme(),
      ),
      headerGeneralTheme: this._.headerGeneralTheme().serialize(),
      tableStyleTheme: this._.tableStyleTheme().serialize(),
      totalTheme: this._.totalTheme().serialize(),
    };
  }

  getColumnThemeForColumn(
    columnId: string,
    columnType: ColumnType,
  ): ColumnTheme {
    const theme =
      columnType === COLUMN_TYPE.metric
        ? this._.fieldsColumnTheme()
        : this._.groupingsColumnTheme();

    if (theme.isPerColumn) {
      return theme.map.forceGet(columnId);
    }

    return theme.value;
  }

  getWorksheetThemeForColumn(
    columnId: string,
    columnType: ColumnType,
  ): WorksheetTheme {
    const theme =
      columnType === COLUMN_TYPE.metric
        ? this._.fieldsWorksheetTheme()
        : this._.groupingsWorksheetTheme();

    if (theme.isPerColumn) {
      return theme.map.forceGet(columnId);
    }

    return theme.value;
  }

  getHeaderColumnwiseThemeForColumn(
    columnId: string,
    columnType: ColumnType,
  ): HeaderColumnwiseTheme {
    const theme =
      columnType === COLUMN_TYPE.metric
        ? this._.fieldsHeaderColumnwiseTheme()
        : this._.groupingsHeaderColumnwiseTheme();

    if (theme.isPerColumn) {
      return theme.map.forceGet(columnId);
    }

    return theme.value;
  }

  updateThemeFromNewFieldColumns(
    fieldColumns: $ReadOnlySet<string>,
  ): Zen.Model<TableTheme> {
    return this._.fieldsColumnTheme(
      getNewPerColumnThemeFromNewColumns(
        this._.fieldsColumnTheme(),
        ColumnTheme.create({}),
        fieldColumns,
      ),
    )
      .fieldsHeaderColumnwiseTheme(
        getNewPerColumnThemeFromNewColumns(
          this._.fieldsHeaderColumnwiseTheme(),
          HeaderColumnwiseTheme.create({}),
          fieldColumns,
        ),
      )
      .fieldsWorksheetTheme(
        getNewPerColumnThemeFromNewColumns(
          this._.fieldsWorksheetTheme(),
          WorksheetTheme.create({}),
          fieldColumns,
        ),
      );
  }

  updateThemeFromNewGroupingColumns(
    groupingColumns: $ReadOnlySet<string>,
  ): Zen.Model<TableTheme> {
    return this._.groupingsColumnTheme(
      getNewPerColumnThemeFromNewColumns(
        this._.groupingsColumnTheme(),
        ColumnTheme.create({}),
        groupingColumns,
      ),
    )
      .groupingsHeaderColumnwiseTheme(
        getNewPerColumnThemeFromNewColumns(
          this._.groupingsHeaderColumnwiseTheme(),
          HeaderColumnwiseTheme.create({}),
          groupingColumns,
        ),
      )
      .groupingsWorksheetTheme(
        getNewPerColumnThemeFromNewColumns(
          this._.groupingsWorksheetTheme(),
          WorksheetTheme.create({}),
          groupingColumns,
        ),
      );
  }
}

export default ((TableTheme: $Cast): Class<Zen.Model<TableTheme>>);
