// @flow
import HeaderColumnwiseTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/HeaderColumnwiseTheme';
import TableStyleTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/TableStyleTheme';
import TableTheme from 'models/visualizations/Table/TableSettings/TableTheme';
import WorksheetTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/WorksheetTheme';

export default (TableTheme.create({
  tableStyleTheme: TableStyleTheme.create({
    backgroundColor: '#001141',
    rowBandingColor: null,
  }),
  fieldsHeaderColumnwiseTheme: HeaderColumnwiseTheme.createAsPerColumnTheme({
    textColor: '#FFFFFF',
  }),
  fieldsWorksheetTheme: WorksheetTheme.createAsPerColumnTheme({
    textColor: '#FFFFFF',
  }),
  groupingsHeaderColumnwiseTheme: HeaderColumnwiseTheme.createAsPerColumnTheme({
    textColor: '#D0E2FF',
  }),
  groupingsWorksheetTheme: WorksheetTheme.createAsPerColumnTheme({
    textColor: '#D0E2FF',
  }),
}): TableTheme);
