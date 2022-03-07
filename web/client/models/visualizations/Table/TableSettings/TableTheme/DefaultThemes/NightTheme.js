// @flow
import GridlinesTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/GridlinesTheme';
import HeaderColumnwiseTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/HeaderColumnwiseTheme';
import TableStyleTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/TableStyleTheme';
import TableTheme from 'models/visualizations/Table/TableSettings/TableTheme';
import WorksheetTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/WorksheetTheme';

export default (TableTheme.create({
  tableStyleTheme: TableStyleTheme.create({
    backgroundColor: '#061727',
    rowBandingColor: '#182837',
  }),
  fieldsHeaderColumnwiseTheme: HeaderColumnwiseTheme.createAsPerColumnTheme({
    textColor: '#C6C6C6',
  }),
  fieldsWorksheetTheme: WorksheetTheme.createAsPerColumnTheme({
    textColor: '#F4F4F4',
  }),
  gridlinesTheme: GridlinesTheme.create({ thickness: 0 }),
  groupingsHeaderColumnwiseTheme: HeaderColumnwiseTheme.createAsPerColumnTheme({
    textColor: '#C6C6C6',
  }),
  groupingsWorksheetTheme: WorksheetTheme.createAsPerColumnTheme({
    textColor: '#F4F4F4',
  }),
}): TableTheme);
