// @flow
import * as React from 'react';
import { useLazyLoadQuery } from 'react-relay/hooks';

import FieldAboutPanelContent from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/FieldCustomizationModule/FieldAboutPanel/FieldAboutPanelContent';
import { databaseIdToRelayId } from 'util/graphql/hasura';
import type { FieldAboutPanelQuery } from './__generated__/FieldAboutPanelQuery.graphql';

type Props = {
  dbFieldId: string,
  formulaCalculationForDisplay: $PropertyType<
    React.ElementConfig<typeof FieldAboutPanelContent>,
    'formulaCalculationForDisplay',
  >,
};

const POLICY = { fetchPolicy: 'store-or-network' };

function FieldAboutPanel({ dbFieldId, formulaCalculationForDisplay }: Props) {
  const relayFieldId = React.useMemo(
    () => databaseIdToRelayId(dbFieldId, 'field'),
    [dbFieldId],
  );

  const data = useLazyLoadQuery<FieldAboutPanelQuery>(
    graphql`
      query FieldAboutPanelQuery($id: ID!) {
        node(id: $id) {
          ... on field {
            ...FieldAboutPanelContent_field
          }
        }
      }
    `,
    { id: relayFieldId },
    POLICY,
  );

  if (!data.node) {
    return null;
  }

  return (
    <div className="field-about-panel">
      <FieldAboutPanelContent
        fieldFragmentRef={data.node}
        formulaCalculationForDisplay={formulaCalculationForDisplay}
      />
    </div>
  );
}

export default (React.memo(FieldAboutPanel): React.AbstractComponent<Props>);
