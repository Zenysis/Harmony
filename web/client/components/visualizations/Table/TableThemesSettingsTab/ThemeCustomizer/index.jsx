// @flow
import * as React from 'react';

import Accordion from 'components/ui/Accordion';
import ColumnAlignmentSection from 'components/visualizations/Table/TableThemesSettingsTab/ThemeCustomizer/ColumnAlignmentSection';
import GridlinesSection from 'components/visualizations/Table/TableThemesSettingsTab/ThemeCustomizer/GridlinesSection';
import HeaderSection from 'components/visualizations/Table/TableThemesSettingsTab/ThemeCustomizer/HeaderSection';
import I18N from 'lib/I18N';
import TableStyleSection from 'components/visualizations/Table/TableThemesSettingsTab/ThemeCustomizer/TableStyleSection';
import TotalSection from 'components/visualizations/Table/TableThemesSettingsTab/ThemeCustomizer/TotalSection';
import WorksheetSection from 'components/visualizations/Table/TableThemesSettingsTab/ThemeCustomizer/WorksheetSection';
import type ColumnTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/ColumnTheme';
import type GridlinesTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/GridlinesTheme';
import type HeaderColumnwiseTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/HeaderColumnwiseTheme';
import type HeaderGeneralTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/HeaderGeneralTheme';
import type TableStyleTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/TableStyleTheme';
import type TableTheme from 'models/visualizations/Table/TableSettings/TableTheme';
import type TotalTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/TotalTheme';
import type WorksheetTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/WorksheetTheme';
import type { PerColumnTheme } from 'models/visualizations/Table/TableSettings/TableTheme/types';
import type { TableColumn } from 'components/visualizations/Table/TableThemesSettingsTab/types';

type Props = {
  groupByColumns: $ReadOnlyArray<TableColumn>,
  seriesColumns: $ReadOnlyArray<TableColumn>,
  onThemeChange: TableTheme => void,
  showTotalThemeControls: boolean,
  theme: TableTheme,
};

function ThemeCustomizer({
  groupByColumns,
  onThemeChange,
  seriesColumns,
  showTotalThemeControls,
  theme,
}: Props): React.Node {
  const [selectedAccordionItem, setSelectedAccordionItem] = React.useState<
    string | void,
  >('Table style');

  // TODO(david): can we avoid making all these annoying callback boilerplate functions?
  const onTableStyleThemeChange = (newTableStyleTheme: TableStyleTheme) =>
    onThemeChange(theme.tableStyleTheme(newTableStyleTheme));

  const onTotalThemeChange = (newTotalTheme: TotalTheme) =>
    onThemeChange(theme.totalTheme(newTotalTheme));

  const onFieldsWorksheetThemeChange = (
    newWorksheetTheme: PerColumnTheme<WorksheetTheme>,
  ) => onThemeChange(theme.fieldsWorksheetTheme(newWorksheetTheme));

  const onGroupingsWorksheetThemeChange = (
    newWorksheetTheme: PerColumnTheme<WorksheetTheme>,
  ) => onThemeChange(theme.groupingsWorksheetTheme(newWorksheetTheme));

  const onFieldsColumnThemeChange = (
    newColumnTheme: PerColumnTheme<ColumnTheme>,
  ) => onThemeChange(theme.fieldsColumnTheme(newColumnTheme));

  const onGroupingsColumnThemeChange = (
    newColumnTheme: PerColumnTheme<ColumnTheme>,
  ) => onThemeChange(theme.groupingsColumnTheme(newColumnTheme));

  const onFieldsHeaderColumnwiseThemeChange = (
    newFieldsHeaderColumnwiseTheme: PerColumnTheme<HeaderColumnwiseTheme>,
  ) =>
    onThemeChange(
      theme.fieldsHeaderColumnwiseTheme(newFieldsHeaderColumnwiseTheme),
    );

  const onGroupingsHeaderColumnwiseThemeChange = (
    newGroupingsHeaderColumnwiseTheme: PerColumnTheme<HeaderColumnwiseTheme>,
  ) =>
    onThemeChange(
      theme.groupingsHeaderColumnwiseTheme(newGroupingsHeaderColumnwiseTheme),
    );

  const onHeaderGeneralThemeChange = (
    newHeaderGeneralTheme: HeaderGeneralTheme,
  ) => onThemeChange(theme.headerGeneralTheme(newHeaderGeneralTheme));

  const onGridlinesThemeChange = (newGridlinesTheme: GridlinesTheme) =>
    onThemeChange(theme.gridlinesTheme(newGridlinesTheme));

  return (
    <div className="table-themes-settings-tab__theme-customizer">
      <Accordion
        onSelectionChange={setSelectedAccordionItem}
        selectedAccordionItem={selectedAccordionItem}
      >
        <Accordion.Item name={I18N.text('Table style')}>
          <TableStyleSection
            onThemeChange={onTableStyleThemeChange}
            theme={theme.tableStyleTheme()}
          />
        </Accordion.Item>
        <Accordion.Item name={I18N.text('Header')}>
          <HeaderSection
            groupByColumns={groupByColumns}
            fieldsHeaderTheme={theme.fieldsHeaderColumnwiseTheme()}
            groupingsHeaderTheme={theme.groupingsHeaderColumnwiseTheme()}
            headerGeneralTheme={theme.headerGeneralTheme()}
            onFieldsHeaderThemeChange={onFieldsHeaderColumnwiseThemeChange}
            onGroupingsHeaderThemeChange={
              onGroupingsHeaderColumnwiseThemeChange
            }
            onHeaderGeneralThemeChange={onHeaderGeneralThemeChange}
            seriesColumns={seriesColumns}
          />
        </Accordion.Item>
        <Accordion.Item name={I18N.text('Worksheet')}>
          <WorksheetSection
            groupByColumns={groupByColumns}
            fieldsWorksheetTheme={theme.fieldsWorksheetTheme()}
            groupingsWorksheetTheme={theme.groupingsWorksheetTheme()}
            onFieldsWorksheetThemeChange={onFieldsWorksheetThemeChange}
            onGroupingsWorksheetThemeChange={onGroupingsWorksheetThemeChange}
            seriesColumns={seriesColumns}
          />
        </Accordion.Item>
        <Accordion.Item name={I18N.text('Column Alignment')}>
          <ColumnAlignmentSection
            groupByColumns={groupByColumns}
            fieldsColumnTheme={theme.fieldsColumnTheme()}
            groupingsColumnTheme={theme.groupingsColumnTheme()}
            onFieldsColumnThemeChange={onFieldsColumnThemeChange}
            onGroupingsColumnThemeChange={onGroupingsColumnThemeChange}
            seriesColumns={seriesColumns}
          />
        </Accordion.Item>
        <Accordion.Item name={I18N.text('Gridlines')}>
          <GridlinesSection
            onThemeChange={onGridlinesThemeChange}
            theme={theme.gridlinesTheme()}
          />
        </Accordion.Item>
        {showTotalThemeControls ? (
          <Accordion.Item name={I18N.text('Total')}>
            <TotalSection
              onThemeChange={onTotalThemeChange}
              theme={theme.totalTheme()}
            />
          </Accordion.Item>
        ) : null}
      </Accordion>
    </div>
  );
}

export default (React.memo<Props>(
  ThemeCustomizer,
): React.AbstractComponent<Props>);
