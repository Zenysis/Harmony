// @flow
import QueryScalingContext from 'components/common/QueryScalingContext';
import type { StyleObject } from 'types/jsCore';

export default function getQueryResultStyle(
  disableVisualizationSpecificScaling: boolean,
  queryScalingContext: $ContextType<typeof QueryScalingContext>,
): StyleObject {
  if (
    disableVisualizationSpecificScaling &&
    queryScalingContext !== undefined
  ) {
    const {
      referenceHeight,
      referenceWidth,
      scaleFactor,
    } = queryScalingContext;
    return {
      height: referenceHeight,
      minHeight: referenceHeight,
      minWidth: referenceWidth,
      transform: `scale(${scaleFactor})`,
      width: referenceWidth,
    };
  }

  return { height: '100%', width: '100%' };
}
