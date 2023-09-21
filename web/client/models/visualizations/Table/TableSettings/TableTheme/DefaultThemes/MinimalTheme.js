// @flow
import GridlinesTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/GridlinesTheme';
import TableStyleTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/TableStyleTheme';
import TableTheme from 'models/visualizations/Table/TableSettings/TableTheme';

export default (TableTheme.create({
  gridlinesTheme: GridlinesTheme.create({ thickness: 0 }),
  tableStyleTheme: TableStyleTheme.create({ rowBandingColor: null }),
}): TableTheme);
