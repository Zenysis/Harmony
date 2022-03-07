// @flow
import type CustomField from 'models/core/Field/CustomField';
import type DataFilterGroup from 'models/core/QueryResultSpec/DataFilterGroup';
import type Field from 'models/core/wip/Field';
import type GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type {
  ResultViewType,
  ResultViewTypeMap,
} from 'components/QueryResult/viewTypes';
import type { ViewSpecificSettings } from 'models/visualizations/common/types';

// By default, a ViewType does not need additional props passed to its
// ControlsBlock component (like AxesSettings, LegendSettings, or
// SeriesSettings). If a ViewType needs these additional props when rendering
// its *controls*, specify them here.
type SupplementalControlsBlockPropsMap = {
  // All ViewTypes have an empty object by default indicating no supplemental
  // props are needed for the ControlsBlock to render.
  ...$ObjMap<ResultViewTypeMap, () => {}>,

  // Supplemental settings for the visualization's controls block.
  BUBBLE_CHART: {
    seriesSettings: SeriesSettings,
  },
  EPICURVE: {
    seriesSettings: SeriesSettings,
  },
  MAP: {
    seriesSettings: SeriesSettings,
  },
  TIME: {
    seriesSettings: SeriesSettings,
  },
};

export type ControlsBlockProps<ViewType: ResultViewType> = {
  // TODO(pablo): rename 'controls' to 'viewSpecificSettings'
  controls: ViewSpecificSettings<ViewType>,
  dataFilters: DataFilterGroup,
  fields: $ReadOnlyArray<CustomField | Field>,
  groupBySettings: GroupBySettings,
  onControlsSettingsChange: (controlKey: string, value: any) => void,

  ...$ElementType<SupplementalControlsBlockPropsMap, ViewType>,
};
