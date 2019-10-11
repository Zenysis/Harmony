// @flow
import PropTypes from 'prop-types';

import AxesSettings from 'models/core/QueryResultSpec/VisualizationSettings/AxesSettings';
import Field from 'models/core/Field';
import LegendSettings from 'models/core/QueryResultSpec/VisualizationSettings/LegendSettings';
import PropDefs from 'util/PropDefs';
import SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import ZenPropTypes from 'util/ZenPropTypes';

export const visualizationPropDefs = PropDefs.create('visualization')
  .propTypes({
    filters: PropTypes.object.isRequired,
    loading: PropTypes.bool.isRequired,
    onQueryDataLoad: PropTypes.func.isRequired, // f(data)
    onQueryDataStartLoading: PropTypes.func.isRequired, // f()

    // TODO(pablo): replace this with QuerySelections instance
    // (will involve refactoring all visualizations)
    selections: PropTypes.object.isRequired,
    seriesSettings: PropTypes.instanceOf(SeriesSettings).isRequired,

    axesSettings: AxesSettings.type(),
    controls: PropTypes.object,
    fields: ZenPropTypes.arrayOfType(Field),
    legendSettings: LegendSettings.type(),
    queryResult: PropTypes.any,
    smallMode: PropTypes.bool,
  })
  .defaultProps({
    axesSettings: undefined,
    controls: undefined,
    fields: [],
    legendSettings: undefined,
    queryResult: undefined,
    smallMode: false,
  });

export const controlsBlockPropDefs = PropDefs.create('controlsBlock')
  .propTypes({
    onControlsSettingsChange: PropTypes.func.isRequired, // f(controlKey, value)
    controls: PropTypes.object.isRequired,
    filters: PropTypes.object.isRequired,
    selections: PropTypes.object.isRequired,

    fields: ZenPropTypes.arrayOfType(Field),
    queryResult: PropTypes.any,
  })
  .defaultProps({
    fields: [],
    queryResult: undefined,
  });
