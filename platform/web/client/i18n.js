// @flow
/* eslint-disable */
import I18N from 'lib/I18N';
import i18n_components_AdminApp from 'components/AdminApp/i18n';
import i18n_components_AdvancedQueryApp from 'components/AdvancedQueryApp/i18n';
import i18n_components_AlertsApp from 'components/AlertsApp/i18n';
import i18n_components_Authentication from 'components/Authentication/i18n';
import i18n_components_DashboardBuilderApp_DashboardContainer_CommonSettingsPanel_BasicElementsSection from 'components/DashboardBuilderApp/DashboardContainer/CommonSettingsPanel/BasicElementsSection/i18n';
import i18n_components_DashboardBuilderApp_DashboardContainer_CommonSettingsPanel_CommonFilterSettings_DashboardFilterSelector from 'components/DashboardBuilderApp/DashboardContainer/CommonSettingsPanel/CommonFilterSettings/DashboardFilterSelector/i18n';
import i18n_components_DashboardBuilderApp_DashboardContainer_CommonSettingsPanel_CommonGroupingSettings_DashboardGroupBySelector from 'components/DashboardBuilderApp/DashboardContainer/CommonSettingsPanel/CommonGroupingSettings/DashboardGroupBySelector/i18n';
import i18n_components_DashboardBuilderApp_DashboardContainer_CommonSettingsPanel_LayoutSection from 'components/DashboardBuilderApp/DashboardContainer/CommonSettingsPanel/LayoutSection/i18n';
import i18n_components_DashboardBuilderApp_DashboardContainer_CommonSettingsPanel_common from 'components/DashboardBuilderApp/DashboardContainer/CommonSettingsPanel/common/i18n';
import i18n_components_DashboardBuilderApp_DashboardContainer_DashboardGrid_FullscreenTile_FooterBar from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/FullscreenTile/FooterBar/i18n';
import i18n_components_DashboardBuilderApp_DashboardContainer_DashboardGrid_GridBackground from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/GridBackground/i18n';
import i18n_components_DashboardBuilderApp_DashboardContainer_DashboardGrid_TileContainer from 'components/DashboardBuilderApp/DashboardContainer/DashboardGrid/TileContainer/i18n';
import i18n_components_DashboardBuilderApp_DashboardHeader_DashboardControls from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/i18n';
import i18n_components_DashboardBuilderApp_hooks from 'components/DashboardBuilderApp/hooks/i18n';
import i18n_components_DataCatalogApp_DirectoryPage_BreadcrumbPath from 'components/DataCatalogApp/DirectoryPage/BreadcrumbPath/i18n';
import i18n_components_DataCatalogApp_DirectoryPage_DirectoryTableContainer_ContainerHeader from 'components/DataCatalogApp/DirectoryPage/DirectoryTableContainer/ContainerHeader/i18n';
import i18n_components_DataCatalogApp_DirectoryPage_DirectoryTableContainer_DirectoryTable from 'components/DataCatalogApp/DirectoryPage/DirectoryTableContainer/DirectoryTable/i18n';
import i18n_components_DataCatalogApp_FieldDetailsPage_FieldCalculationSection from 'components/DataCatalogApp/FieldDetailsPage/FieldCalculationSection/i18n';
import i18n_components_DataCatalogApp_FieldDetailsPage_FieldDetailsSection from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/i18n';
import i18n_components_DataCatalogApp_FieldDetailsPage_FieldDimensionSection from 'components/DataCatalogApp/FieldDetailsPage/FieldDimensionSection/i18n';
import i18n_components_DataCatalogApp_FieldDetailsPage_FieldProfilingSection from 'components/DataCatalogApp/FieldDetailsPage/FieldProfilingSection/i18n';
import i18n_components_DataCatalogApp_FieldDetailsPage_FieldTitleSection from 'components/DataCatalogApp/FieldDetailsPage/FieldTitleSection/i18n';
import i18n_components_DataCatalogApp_common from 'components/DataCatalogApp/common/i18n';
import i18n_components_DataDigestApp from 'components/DataDigestApp/i18n';
import i18n_components_DataQualityApp from 'components/DataQualityApp/i18n';
import i18n_components_DataUploadApp from 'components/DataUploadApp/i18n';
import i18n_components_FieldSetupApp from 'components/FieldSetupApp/i18n';
import i18n_components_Navbar from 'components/Navbar/i18n';
import i18n_components_NewUserButton from 'components/NewUserButton/i18n';
import i18n_components_NotFoundPage from 'components/NotFoundPage/i18n';
import i18n_components_Overview from 'components/Overview/i18n';
import i18n_components_QueryResult from 'components/QueryResult/i18n';
import i18n_components_UnauthorizedPage from 'components/UnauthorizedPage/i18n';
import i18n_components_common from 'components/common/i18n';
import i18n_components_ui_ColorBlock from 'components/ui/ColorBlock/i18n';
import i18n_components_ui_DatePicker from 'components/ui/DatePicker/i18n';
import i18n_components_ui_Dropdown from 'components/ui/Dropdown/i18n';
import i18n_components_ui_HierarchicalSelector from 'components/ui/HierarchicalSelector/i18n';
import i18n_components_ui_LoadingSpinner from 'components/ui/LoadingSpinner/i18n';
import i18n_components_ui_PageSelector from 'components/ui/PageSelector/i18n';
import i18n_components_ui_ProgressModal from 'components/ui/ProgressModal/i18n';
import i18n_components_ui_Table from 'components/ui/Table/i18n';
import i18n_components_ui_Tag from 'components/ui/Tag/i18n';
import i18n_components_ui_UploadInput from 'components/ui/UploadInput/i18n';
import i18n_components_ui_visualizations_BarGraph from 'components/ui/visualizations/BarGraph/i18n';
import i18n_components_ui_visualizations_BoxPlot_internal from 'components/ui/visualizations/BoxPlot/internal/i18n';
import i18n_components_ui_visualizations_BoxPlot_models from 'components/ui/visualizations/BoxPlot/models/i18n';
import i18n_components_ui_visualizations_BumpChart_internal from 'components/ui/visualizations/BumpChart/internal/i18n';
import i18n_components_ui_visualizations_MapCore from 'components/ui/visualizations/MapCore/i18n';
import i18n_components_ui_visualizations_Table from 'components/ui/visualizations/Table/i18n';
import i18n_components_visualizations_BarGraph_BarGraphControlsBlock from 'components/visualizations/BarGraph/BarGraphControlsBlock/i18n';
import i18n_components_visualizations_BoxPlot_BoxPlotControlsBlock from 'components/visualizations/BoxPlot/BoxPlotControlsBlock/i18n';
import i18n_components_visualizations_BubbleChart from 'components/visualizations/BubbleChart/i18n';
import i18n_components_visualizations_BumpChart_BumpChartControlsBlock from 'components/visualizations/BumpChart/BumpChartControlsBlock/i18n';
import i18n_components_visualizations_HeatTiles_HeatTilesControlsBlock from 'components/visualizations/HeatTiles/HeatTilesControlsBlock/i18n';
import i18n_components_visualizations_Histogram_HistogramControlsBlock from 'components/visualizations/Histogram/HistogramControlsBlock/i18n';
import i18n_components_visualizations_LineGraph_LineGraphControlsBlock from 'components/visualizations/LineGraph/LineGraphControlsBlock/i18n';
import i18n_components_visualizations_MapViz_MapControlsBlock from 'components/visualizations/MapViz/MapControlsBlock/i18n';
import i18n_components_visualizations_MapViz_QueryResultLayer from 'components/visualizations/MapViz/QueryResultLayer/i18n';
import i18n_components_visualizations_NumberTrend_NumberTrendControlsBlock from 'components/visualizations/NumberTrend/NumberTrendControlsBlock/i18n';
import i18n_components_visualizations_PieChart from 'components/visualizations/PieChart/i18n';
import i18n_components_visualizations_Sunburst from 'components/visualizations/Sunburst/i18n';
import i18n_components_visualizations_Table from 'components/visualizations/Table/i18n';
import i18n_components_visualizations_common from 'components/visualizations/common/i18n';
import i18n_locales from 'locales/i18n';
import i18n_models_AdvancedQueryApp_Insights_DataQualityInsight from 'models/AdvancedQueryApp/Insights/DataQualityInsight/i18n';
import i18n_models_AdvancedQueryApp_QueryTabItem from 'models/AdvancedQueryApp/QueryTabItem/i18n';
import i18n_models_AdvancedQueryApp_VisualizationType from 'models/AdvancedQueryApp/VisualizationType/i18n';
import i18n_models_AlertsApp from 'models/AlertsApp/i18n';
import i18n_models_DataQualityApp from 'models/DataQualityApp/i18n';
import i18n_models_core_DataCatalog from 'models/core/DataCatalog/i18n';
import i18n_models_core_Field_CustomField_Formula from 'models/core/Field/CustomField/Formula/i18n';
import i18n_models_core_QueryResultSpec from 'models/core/QueryResultSpec/i18n';
import i18n_models_core_wip_Calculation from 'models/core/wip/Calculation/i18n';
import i18n_models_core_wip_QueryFilterItem from 'models/core/wip/QueryFilterItem/i18n';
import i18n_models_visualizations_Table_TableSettings_TableTheme_DefaultThemes from 'models/visualizations/Table/TableSettings/TableTheme/DefaultThemes/i18n';
import i18n_services from 'services/i18n';
import i18n_util from 'util/i18n';
import i18n_validation from 'validation/i18n';
import type { TranslationDictionary } from 'lib/I18N';
/**
 * DO NOT:
 * 1. DO NOT touch the `en` object. AT ALL. This is entirely auto-generated from
 * our code. Do not change the string values. Do not add new keys.
 * 2. DO NOT add new locales manually. These are handled by our internal tools.
 *
 * DO:
 * 1. Update any non-`en` translations. Do not change their keys though.
 * 2. Add new non-`en` translations. But make sure their keys match their
 * English counterpart.
 */

const translations: TranslationDictionary = {
  en: {},
  vn: {},
  am: {},
  fr: {},
  br: {},
  pt: {},
};

I18N.mergeSupplementalTranslations(translations, [
  i18n_components_AdminApp,
  i18n_components_AdvancedQueryApp,
  i18n_components_AlertsApp,
  i18n_components_Authentication,
  i18n_components_DashboardBuilderApp_DashboardContainer_CommonSettingsPanel_BasicElementsSection,
  i18n_components_DashboardBuilderApp_DashboardContainer_CommonSettingsPanel_CommonFilterSettings_DashboardFilterSelector,
  i18n_components_DashboardBuilderApp_DashboardContainer_CommonSettingsPanel_CommonGroupingSettings_DashboardGroupBySelector,
  i18n_components_DashboardBuilderApp_DashboardContainer_CommonSettingsPanel_LayoutSection,
  i18n_components_DashboardBuilderApp_DashboardContainer_CommonSettingsPanel_common,
  i18n_components_DashboardBuilderApp_DashboardContainer_DashboardGrid_FullscreenTile_FooterBar,
  i18n_components_DashboardBuilderApp_DashboardContainer_DashboardGrid_GridBackground,
  i18n_components_DashboardBuilderApp_DashboardContainer_DashboardGrid_TileContainer,
  i18n_components_DashboardBuilderApp_DashboardHeader_DashboardControls,
  i18n_components_DashboardBuilderApp_hooks,
  i18n_components_DataCatalogApp_DirectoryPage_BreadcrumbPath,
  i18n_components_DataCatalogApp_DirectoryPage_DirectoryTableContainer_ContainerHeader,
  i18n_components_DataCatalogApp_DirectoryPage_DirectoryTableContainer_DirectoryTable,
  i18n_components_DataCatalogApp_FieldDetailsPage_FieldCalculationSection,
  i18n_components_DataCatalogApp_FieldDetailsPage_FieldDetailsSection,
  i18n_components_DataCatalogApp_FieldDetailsPage_FieldDimensionSection,
  i18n_components_DataCatalogApp_FieldDetailsPage_FieldProfilingSection,
  i18n_components_DataCatalogApp_FieldDetailsPage_FieldTitleSection,
  i18n_components_DataCatalogApp_common,
  i18n_components_DataDigestApp,
  i18n_components_DataQualityApp,
  i18n_components_DataUploadApp,
  i18n_components_FieldSetupApp,
  i18n_components_Navbar,
  i18n_components_NewUserButton,
  i18n_components_NotFoundPage,
  i18n_components_Overview,
  i18n_components_QueryResult,
  i18n_components_UnauthorizedPage,
  i18n_components_common,
  i18n_components_ui_ColorBlock,
  i18n_components_ui_DatePicker,
  i18n_components_ui_Dropdown,
  i18n_components_ui_HierarchicalSelector,
  i18n_components_ui_LoadingSpinner,
  i18n_components_ui_PageSelector,
  i18n_components_ui_ProgressModal,
  i18n_components_ui_Table,
  i18n_components_ui_Tag,
  i18n_components_ui_UploadInput,
  i18n_components_ui_visualizations_BarGraph,
  i18n_components_ui_visualizations_BoxPlot_internal,
  i18n_components_ui_visualizations_BoxPlot_models,
  i18n_components_ui_visualizations_BumpChart_internal,
  i18n_components_ui_visualizations_MapCore,
  i18n_components_ui_visualizations_Table,
  i18n_components_visualizations_BarGraph_BarGraphControlsBlock,
  i18n_components_visualizations_BoxPlot_BoxPlotControlsBlock,
  i18n_components_visualizations_BubbleChart,
  i18n_components_visualizations_BumpChart_BumpChartControlsBlock,
  i18n_components_visualizations_HeatTiles_HeatTilesControlsBlock,
  i18n_components_visualizations_Histogram_HistogramControlsBlock,
  i18n_components_visualizations_LineGraph_LineGraphControlsBlock,
  i18n_components_visualizations_MapViz_MapControlsBlock,
  i18n_components_visualizations_MapViz_QueryResultLayer,
  i18n_components_visualizations_NumberTrend_NumberTrendControlsBlock,
  i18n_components_visualizations_PieChart,
  i18n_components_visualizations_Sunburst,
  i18n_components_visualizations_Table,
  i18n_components_visualizations_common,
  i18n_locales,
  i18n_models_AdvancedQueryApp_Insights_DataQualityInsight,
  i18n_models_AdvancedQueryApp_QueryTabItem,
  i18n_models_AdvancedQueryApp_VisualizationType,
  i18n_models_AlertsApp,
  i18n_models_DataQualityApp,
  i18n_models_core_DataCatalog,
  i18n_models_core_Field_CustomField_Formula,
  i18n_models_core_QueryResultSpec,
  i18n_models_core_wip_Calculation,
  i18n_models_core_wip_QueryFilterItem,
  i18n_models_visualizations_Table_TableSettings_TableTheme_DefaultThemes,
  i18n_services,
  i18n_util,
  i18n_validation,
]);
export default translations;
