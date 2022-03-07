//  @flow
import * as Zen from 'lib/Zen';
import type ColumnTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/ColumnTheme';
import type HeaderColumnwiseTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/HeaderColumnwiseTheme';
import type TotalTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/TotalTheme';
import type WorksheetTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/WorksheetTheme';

export type Theme =
  | WorksheetTheme
  | HeaderColumnwiseTheme
  | ColumnTheme
  | TotalTheme;

export type PerColumnTheme<T: Theme> =
  | {
      isPerColumn: true,
      map: Zen.Map<T>,
    }
  | {
      isPerColumn: false,
      value: T,
    };

export type SerializedPerColumnTheme<T: Theme> =
  | {
      isPerColumn: true,
      value: { [key: string]: Zen.Serialized<T>, ... },
    }
  | {
      isPerColumn: false,
      value: { ALL_COLUMNS: Zen.Serialized<T> },
    };
