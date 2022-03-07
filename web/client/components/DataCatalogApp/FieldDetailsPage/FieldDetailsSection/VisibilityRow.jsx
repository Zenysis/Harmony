// @flow
import * as React from 'react';
import { useFragment, useMutation } from 'react-relay/hooks';

import EditableVisibilityStatusDropdownValue from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/EditableVisibilityStatusDropdownValue';
import FieldDetailsListItem from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/FieldDetailsListItem';
import I18N from 'lib/I18N';
import type { VisibilityRow_field$key } from './__generated__/VisibilityRow_field.graphql';

type Props = {
  field: VisibilityRow_field$key,
};

export default function VisibilityRow({ field }: Props): React.Node {
  const { fieldCategoryMappings } = useFragment(
    graphql`
      fragment VisibilityRow_field on field {
        fieldCategoryMappings: field_category_mappings {
          categoryId: category_id
          fieldId: field_id
          visibilityStatus: visibility_status
        }
      }
    `,
    field,
  );

  // NOTE(yitian): Currently only working with fields that has 1 field category
  // mapping. Will update this to support visibility status of many field
  // category mapping once that field copy feature is enabled.
  const fieldCategoryMapping = fieldCategoryMappings[0];

  const [commit] = useMutation(
    graphql`
      mutation VisibilityRowMutation(
        $dbCategoryId: String!
        $dbFieldId: String!
        $newVisibilityStatus: visibility_status_enum!
      ) {
        update_field_category_mapping(
          where: {
            category_id: { _eq: $dbCategoryId }
            field_id: { _eq: $dbFieldId }
          }
          _set: { visibility_status: $newVisibilityStatus }
        ) {
          returning {
            field_id
            category_id
            visibility_status
          }
        }
      }
    `,
  );

  const onChange = React.useCallback(
    newVisibilityStatus => {
      commit({
        variables: {
          dbCategoryId: fieldCategoryMapping.categoryId,
          dbFieldId: fieldCategoryMapping.fieldId,
          newVisibilityStatus,
        },
      });
    },
    [fieldCategoryMapping, commit],
  );

  // NOTE(solo): Field category mapping can be null. Add a check to prevent the page
  // from crashing when the field is deleted.
  if (!fieldCategoryMapping) {
    return null;
  }

  return (
    <FieldDetailsListItem title={I18N.textById('Visibility status')}>
      <EditableVisibilityStatusDropdownValue
        onChange={onChange}
        value={fieldCategoryMapping.visibilityStatus}
      />
    </FieldDetailsListItem>
  );
}
