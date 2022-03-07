// @flow
import GridlinesTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/GridlinesTheme';
import HeaderColumnwiseTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/HeaderColumnwiseTheme';
import HeaderGeneralTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/HeaderGeneralTheme';
import TableStyleTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/TableStyleTheme';
import TableTheme from 'models/visualizations/Table/TableSettings/TableTheme';
import WorksheetTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/WorksheetTheme';

export default (TableTheme.create({
  tableStyleTheme: TableStyleTheme.create({
    backgroundColor: '#C5DBCA',
    borderColor: '#194023',
    rowBandingColor: null,
  }),
  fieldsHeaderColumnwiseTheme: HeaderColumnwiseTheme.createAsPerColumnTheme({
    textColor: '#194023',
  }),
  fieldsWorksheetTheme: WorksheetTheme.createAsPerColumnTheme({
    backgroundColor: '#EDF2F0',
    textColor: '#071908',
  }),
  groupingsHeaderColumnwiseTheme: HeaderColumnwiseTheme.createAsPerColumnTheme({
    textColor: '#194023',
  }),
  groupingsWorksheetTheme: WorksheetTheme.createAsPerColumnTheme({
    textColor: '#071908',
  }),
  headerGeneralTheme: HeaderGeneralTheme.create({
    headerLineColor: '#194023',
  }),
  gridlinesTheme: GridlinesTheme.create({ color: '#194023', thickness: 1 }),
}): TableTheme);
