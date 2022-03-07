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
      scaleFactor,
      referenceHeight,
      referenceWidth,
    } = queryScalingContext;
    return {
      height: referenceHeight,
      minHeight: referenceHeight,
      width: referenceWidth,
      minWidth: referenceWidth,
      transform: `scale(${scaleFactor})`,
    };
  }

  return { height: '100%', width: '100%' };
}
