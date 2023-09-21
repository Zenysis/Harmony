// @flow
import * as React from 'react';
import { useFragment } from 'react-relay/hooks';

import FieldDetailsListItem from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/FieldDetailsListItem';
import I18N from 'lib/I18N';
import type {
  DatasourceRow_field$data,
  DatasourceRow_field$key,
} from './__generated__/DatasourceRow_field.graphql';

type Props = {
  field: DatasourceRow_field$key,
};

export default function DatasourceRow({ field }: Props): React.Node {
  const data: DatasourceRow_field$data = useFragment(
    graphql`
      fragment DatasourceRow_field on field {
        fieldPipelineDatasourceMappings: field_pipeline_datasource_mappings {
          pipelineDatasource: pipeline_datasource {
            id
            name
          }
        }
      }
    `,
    field,
  );
  return (
    <FieldDetailsListItem title={I18N.text('Data sources')}>
      {data.fieldPipelineDatasourceMappings.map(({ pipelineDatasource }) => (
        <div key={pipelineDatasource.id}>{pipelineDatasource.name}</div>
      ))}
    </FieldDetailsListItem>
  );
}
