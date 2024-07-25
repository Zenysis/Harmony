// @flow
import * as React from 'react';
import { useFragment } from 'react-relay/hooks';

import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import MultiLineText from 'components/DataCatalogApp/common/MultiLineText';
import Table from 'components/ui/Table';
import { getFullDimensionName } from 'models/core/wip/Dimension';
import { relayIdToDatabaseId } from 'util/graphql';
import type { FieldDimensionSection_field$key } from './__generated__/FieldDimensionSection_field.graphql';

type Props = {
  field: FieldDimensionSection_field$key,
};

const HEADERS = [
  {
    displayContent: I18N.text('Grouping'),
    id: 'name',
  },
  {
    displayContent: I18N.textById('description'),
    id: 'description',
  },
];

// TODO: Have the name populated in the DB. Figure out how to handle
// translations when that happens.
function getDimensionName(dimensionId: string): string {
  const dbDimensionId = relayIdToDatabaseId(dimensionId);
  return getFullDimensionName(dbDimensionId);
}

function renderRow({
  description,
  id,
  name,
}: {
  description: string,
  id: string,
  name: string,
}) {
  return (
    <Table.Row id={id}>
      <Table.Cell>{name}</Table.Cell>
      <Table.Cell>
        <MultiLineText text={description} />
      </Table.Cell>
    </Table.Row>
  );
}

export default function FieldDimensionSection({ field }: Props): React.Node {
  const data = useFragment(
    graphql`
      fragment FieldDimensionSection_field on field {
        fieldDimensionMappings: field_dimension_mappings {
          dimension {
            id
            name
            description
          }
        }
      }
    `,
    field,
  );

  const rows = React.useMemo(
    () =>
      data.fieldDimensionMappings
        .map(({ dimension }) => ({
          description: dimension.description || '',
          id: dimension.id,
          name: dimension.name || getDimensionName(dimension.id),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [data],
  );

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="field-dimension-section">
      <Heading size="small">{I18N.text('Supported Groupings')}</Heading>
      <Table
        className="field-dimension-section__table"
        data={rows}
        headers={HEADERS}
        renderRow={renderRow}
      />
    </div>
  );
}
