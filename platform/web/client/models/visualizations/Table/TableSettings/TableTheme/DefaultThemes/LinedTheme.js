// @flow
import TableStyleTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/TableStyleTheme';
import TableTheme from 'models/visualizations/Table/TableSettings/TableTheme';

export default (TableTheme.create({
  tableStyleTheme: TableStyleTheme.create({ rowBandingColor: null }),
}): TableTheme);
