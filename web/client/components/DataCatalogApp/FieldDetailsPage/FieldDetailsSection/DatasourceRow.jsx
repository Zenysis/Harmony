// @flow
import * as React from 'react';
import { useFragment } from 'react-relay/hooks';

import FieldDetailsListItem from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/FieldDetailsListItem';
import type {
  DatasourceRow_field$data,
  DatasourceRow_field$key,
} from './__generated__/DatasourceRow_field.graphql';

type Props = {
  field: DatasourceRow_field$key,
};

const TEXT = {
  title: 'Data sources',
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
    <FieldDetailsListItem title={TEXT.title}>
      {data.fieldPipelineDatasourceMappings.map(({ pipelineDatasource }) => (
        <div key={pipelineDatasource.id}>{pipelineDatasource.name}</div>
      ))}
    </FieldDetailsListItem>
  );
}
