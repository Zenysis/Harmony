// @flow
import * as React from 'react';
import { useLazyLoadQuery } from 'react-relay/hooks';

import I18N from 'lib/I18N';
import type {
  BatchPublishModalContentsQuery,
  BatchPublishModalContentsQueryResponse,
} from './__generated__/BatchPublishModalContentsQuery.graphql';

const POLICY = { fetchPolicy: 'network-only' };

type Props = {
  onPublishableFieldEdgesChange: BatchPublishModalContentsQueryResponse => void,
};

// Batch publish modal contents. Wraps the query required to power the modal.
export default function BatchPublishModalContents({
  onPublishableFieldEdgesChange,
}: Props): React.Element<'div'> {
  // Only fetch publishable fields -- fields with no null properties.
  // Disabling lint errors that warn us about not using the properties here.
  // These values are used in the parent container, but we do not want the modal
  // component to be waiting for the query to load, rather always rendering the
  // modal and waiting for the contents to load. Thus, we need to separate out
  // the contents from the modal itself, even though the modal requires the
  // contents data to render a publish action.
  /* eslint-disable */
  const {
    publishableFields,
  } = useLazyLoadQuery<BatchPublishModalContentsQuery>(
    graphql`
      query BatchPublishModalContentsQuery {
        publishableFields: unpublished_field_connection(
          where: {
            _and: {
              calculation: { _is_null: false }
              id: { _is_null: false }
              name: { _is_null: false }
              short_name: { _is_null: false }
              unpublished_field_category_mappings: { id: { _is_null: false } }
              unpublished_field_pipeline_datasource_mappings: {
                id: { _is_null: false }
              }
            }
          }
        ) {
          edges {
            node {
              id
              name
              shortName: short_name
              description
              calculation
              unpublishedFieldCategoryMappings: unpublished_field_category_mappings {
                categoryId: category_id
              }
              unpublishedFieldPipelineDatasourceMappings: unpublished_field_pipeline_datasource_mappings {
                pipelineDatasourceId: pipeline_datasource_id
              }
            }
          }
        }
      }
    `,
    {},
    POLICY,
  );

  React.useEffect(() => {
    onPublishableFieldEdgesChange({ publishableFields });
  }, [onPublishableFieldEdgesChange, publishableFields]);

  const publishableFieldEdges = publishableFields.edges;

  const fieldNames = publishableFieldEdges.map(({ node }) => node.name);

  const numPublishableFields = publishableFieldEdges.length;

  const title = (
    <I18N
      numPublishableFields={numPublishableFields}
      plural={numPublishableFields > 1 ? 's' : ''}
    >
      The following %(numPublishableFields)s indicator%(plural)s will be
      published
    </I18N>
  );

  const noFieldsTitle = (
    <I18N id="onPublishableFields">
      There are no publishable fields, please make sure all properties are
      filled in.
    </I18N>
  );

  return (
    <div className="fs-batch-publish-action">
      <div className="fs-batch-publish-action__title">
        {numPublishableFields > 0 ? title : noFieldsTitle}
      </div>
      <ul className="fs-batch-publish-action__indicator-names">
        {fieldNames.map(name => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </div>
  );
}
