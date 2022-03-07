// @flow
import * as React from 'react';
import { useFragment, useMutation } from 'react-relay/hooks';

import Dropdown from 'components/ui/Dropdown';
import I18N from 'lib/I18N';
import { relayIdToDatabaseId } from 'util/graphql';
import type { DatasourceInput_pipelineDatasourceConnection$key } from './__generated__/DatasourceInput_pipelineDatasourceConnection.graphql';
import type { DatasourceInput_unpublishedField$key } from './__generated__/DatasourceInput_unpublishedField.graphql';

type Props = {
  datasourceConnectionRef: DatasourceInput_pipelineDatasourceConnection$key,
  unpublishedFieldRef: DatasourceInput_unpublishedField$key,
};

/** Uncontrolled component that manages datasource inputs and commits changes. */
export default function DatasourceInput({
  datasourceConnectionRef,
  unpublishedFieldRef,
}: Props): React.Element<typeof Dropdown> {
  const fieldData = useFragment(
    graphql`
      fragment DatasourceInput_unpublishedField on unpublished_field {
        id
        unpublishedFieldPipelineDatasourceMappings: unpublished_field_pipeline_datasource_mappings {
          datasource: pipeline_datasource {
            id
            name
          }
        }
      }
    `,
    unpublishedFieldRef,
  );

  const datasources = useFragment(
    graphql`
      fragment DatasourceInput_pipelineDatasourceConnection on pipeline_datasourceConnection {
        edges {
          node {
            id
            name
          }
        }
      }
    `,
    datasourceConnectionRef,
  );

  // NOTE(yitian): We are currently only supporting fields mapping to one
  // datasource. We update mappings by first removing all old mappings associated
  // with the field and add our new mapping.
  const [commit] = useMutation(
    graphql`
      mutation DatasourceInputMutation(
        $pipelineDatasourceId: String!
        $unpublishedFieldId: String!
      ) {
        delete_unpublished_field_pipeline_datasource_mapping(
          where: { unpublished_field_id: { _eq: $unpublishedFieldId } }
        ) {
          returning {
            id
            pipeline_datasource_id
            unpublished_field_id
          }
        }

        insert_unpublished_field_pipeline_datasource_mapping(
          objects: [
            {
              unpublished_field_id: $unpublishedFieldId
              pipeline_datasource_id: $pipelineDatasourceId
            }
          ]
        ) {
          returning {
            id
            pipeline_datasource {
              id
            }
            unpublished_field {
              id
              ...UnpublishedFieldRow_unpublishedField
            }
          }
        }
      }
    `,
  );

  const { id: fieldId, unpublishedFieldPipelineDatasourceMappings } = fieldData;

  // Fields only map to 1 datasource currently so we are using the first
  // mapping.
  const datasourceId =
    unpublishedFieldPipelineDatasourceMappings.length === 0
      ? undefined
      : unpublishedFieldPipelineDatasourceMappings[0].datasource.id;

  const onDatasourceChange = React.useCallback(
    (newDatasourceId: string) => {
      commit({
        variables: {
          pipelineDatasourceId: relayIdToDatabaseId(newDatasourceId),
          unpublishedFieldId: relayIdToDatabaseId(fieldId),
        },
      });
    },
    [commit, fieldId],
  );

  return (
    <Dropdown
      defaultDisplayContent={I18N.text('Select a datasource')}
      onSelectionChange={onDatasourceChange}
      value={datasourceId}
    >
      {datasources.edges.map(({ node }) => (
        <Dropdown.Option key={node.id} value={node.id}>
          {node.name}
        </Dropdown.Option>
      ))}
    </Dropdown>
  );
}
