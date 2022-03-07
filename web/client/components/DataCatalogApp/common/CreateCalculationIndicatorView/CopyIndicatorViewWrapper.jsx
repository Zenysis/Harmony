// @flow
import * as React from 'react';
import { useLazyLoadQuery } from 'react-relay/hooks';

import CopyIndicatorView from 'components/DataCatalogApp/common/CreateCalculationIndicatorView/CopyIndicatorView';
import type { Calculation } from 'models/core/wip/Calculation/types';
import type { CopyIndicatorViewWrapperQuery } from './__generated__/CopyIndicatorViewWrapperQuery.graphql';

type Props = {
  fieldId: string,
  editableCalculation: Calculation | void,
  onCalculationChange: Calculation => void,
};

const POLICY = { fetchPolicy: 'store-or-network' };

// A wrapper component for the copy indicator view. The main function of this
// component is to allow us to optionally return CopyIndicatorView when data for
// a field node of given fieldId exists.
export default function CopyIndicatorViewWrapper({
  fieldId,
  editableCalculation,
  onCalculationChange,
}: Props): React.Element<typeof CopyIndicatorView> | null {
  const data = useLazyLoadQuery<CopyIndicatorViewWrapperQuery>(
    graphql`
      query CopyIndicatorViewWrapperQuery($id: ID!) {
        node(id: $id) {
          ... on field {
            ...CopyIndicatorView_field
          }
        }
        dimensionConnection: dimension_connection {
          ...CopyIndicatorView_dimensionConnection
        }
      }
    `,
    { id: fieldId },
    POLICY,
  );

  if (!data.node) {
    return null;
  }

  return (
    <CopyIndicatorView
      dimensionConnection={data.dimensionConnection}
      editableCalculation={editableCalculation}
      fieldConnection={data.node}
      onCalculationChange={onCalculationChange}
    />
  );
}
