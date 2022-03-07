// @flow
import * as React from 'react';

import QueryScalingContext from 'components/common/QueryScalingContext';
import type TitleSettings from 'models/core/QueryResultSpec/TitleSettings';
import type { StyleObject } from 'types/jsCore';

const TEXT = t('visualizations.common.Title');

type Props = {
  displayTitle: string,
  settings: TitleSettings,
  isMobile?: boolean,
  numExtraFields?: number,
};

type TitleStyles = {
  graphSubtitle: StyleObject,
  graphTitle: StyleObject,
  graphTitleBlock: StyleObject,
};

// TODO(stephen, anyone): This component has not received love for a very long
// time and should be refactored.
function GraphTitle({
  displayTitle,
  settings,
  isMobile = false,
  numExtraFields = 0,
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

  // HACK(stephen): Build the scaled graph title sizing by hand because query
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
        paddingBottom: 8 * scaleFactor,
      },
    }),
    [color, fontFamily, scaleFactor, subtitleFontSize, titleFontSize],
  );
  const extraFields =
    numExtraFields > 0 ? `+ ${numExtraFields.toString()} ${TEXT.more}` : '';

  // TODO(nina): We could probably combine the two outer divs
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
