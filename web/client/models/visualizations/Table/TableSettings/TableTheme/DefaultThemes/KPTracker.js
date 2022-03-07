// @flow
import ColumnTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/ColumnTheme';
import GridlinesTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/GridlinesTheme';
import HeaderColumnwiseTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/HeaderColumnwiseTheme';
import HeaderGeneralTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/HeaderGeneralTheme';
import TableStyleTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/TableStyleTheme';
import TableTheme from 'models/visualizations/Table/TableSettings/TableTheme';

export default (TableTheme.create({
  fieldsColumnTheme: ColumnTheme.createAsPerColumnTheme({
    alignment: 'center',
    widthRatio: 1,
  }),
  fieldsHeaderColumnwiseTheme: HeaderColumnwiseTheme.createAsPerColumnTheme({
    rotateHeader: true,
    textSize: 11,
  }),
  gridlinesTheme: GridlinesTheme.create({ color: '#000000' }),
  groupingsHeaderColumnwiseTheme: HeaderColumnwiseTheme.createAsPerColumnTheme({
    textSize: 11,
  }),
  groupingsColumnTheme: ColumnTheme.createAsPerColumnTheme({
    widthRatio: 3,
  }),
  headerGeneralTheme: HeaderGeneralTheme.create({ headerLineColor: '#000000' }),
  tableStyleTheme: TableStyleTheme.create({
    rowBandingColor: null,
    useFixedColumnWidthRatios: true,
  }),
}): TableTheme);
