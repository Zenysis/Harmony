// @flow
import * as React from 'react';

import I18N from 'lib/I18N';
import QueryScalingContext from 'components/common/QueryScalingContext';
import type TitleSettings from 'models/core/QueryResultSpec/TitleSettings';
import type { StyleObject } from 'types/jsCore';

type Props = {
  displayTitle: string,
  isMobile?: boolean,
  numExtraFields?: number,
  settings: TitleSettings,
};

type TitleStyles = {
  graphSubtitle: StyleObject,
  graphTitle: StyleObject,
  graphTitleBlock: StyleObject,
};

// TODO: This component has not received love for a very long
// time and should be refactored.
function GraphTitle({
  displayTitle,
  isMobile = false,
  numExtraFields = 0,
  settings,
}: Props) {
  const queryScalingContext = React.useContext(QueryScalingContext);
  const scaleFactor =
    queryScalingContext !== undefined ? queryScalingContext.scaleFactor : 1;
  const color = settings.titleFontColor();
  const fontFamily = settings.titleFontFamily();
  const titleFontSize = !isMobile
    ? Number.parseInt(settings.titleFontSize(), 10)
    : 17;
  const subtitleFontSize = !isMobile
    ? Number.parseInt(settings.subtitleFontSize(), 10)
    : 15;

  // NOTE: Build the scaled graph title sizing by hand because query
  // result scaling is hard to apply when the styles are set through css.
  const styles = React.useMemo<TitleStyles>(
    () => ({
      graphSubtitle: {
        color,
        fontFamily,
        fontSize: subtitleFontSize * scaleFactor,
      },
      graphTitle: {
        color,
        fontFamily,
        fontSize: titleFontSize * scaleFactor,
      },
      graphTitleBlock: {
        // NOTE If changed, components/ui/visualizations/Table/index.jsx newHeight to be updated
        paddingBottom: 8 * scaleFactor,
      },
    }),
    [color, fontFamily, scaleFactor, subtitleFontSize, titleFontSize],
  );
  const extraFields =
    numExtraFields > 0
      ? `+ ${numExtraFields.toString()} ${I18N.text('more')}`
      : '';
  // TODO: We could probably combine the two outer divs
  return (
    <div className="title">
      <div className="graph-title-block" style={styles.graphTitleBlock}>
        <div className="graph-title-block__title" style={styles.graphTitle}>
          {displayTitle}{' '}
          <span className="title-extra-fields">{extraFields}</span>
        </div>
        <div
          className="graph-title-block__subtitle"
          style={styles.graphSubtitle}
        >
          {settings.subtitle()}
        </div>
      </div>
    </div>
  );
}

export default (React.memo(GraphTitle): React.AbstractComponent<Props>);
