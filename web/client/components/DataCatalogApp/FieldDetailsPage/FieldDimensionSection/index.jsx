// @flow
import * as React from 'react';
import { useFragment } from 'react-relay/hooks';

import Heading from 'components/ui/Heading';
import MultiLineText from 'components/DataCatalogApp/common/MultiLineText';
import Table from 'components/ui/Table';
import { relayIdToDatabaseId } from 'util/graphql';
import type { FieldDimensionSection_field$key } from './__generated__/FieldDimensionSection_field.graphql';

type Props = {
  field: FieldDimensionSection_field$key,
};

const TEXT = {
  dimensionDescriptionColumn: 'Description',
  dimensionNameColumn: 'Grouping',
  title: 'Supported Groupings',
};

const HEADERS = [
  {
    id: 'name',
    displayContent: TEXT.dimensionNameColumn,
  },
  {
    id: 'description',
    displayContent: TEXT.dimensionDescriptionColumn,
  },
];

// TODO(stephen): Have the name populated in the DB. Figure out how to handle
// translations when that happens.
const DIMENSION_NAME_TEXT = t('select_granularity');

function getDimensionName(dimensionId: string): string {
  const dbDimensionId = relayIdToDatabaseId(dimensionId);
  return DIMENSION_NAME_TEXT[dbDimensionId] || '';
}

function renderRow({
  id,
  name,
  description,
}: {
  id: string,
  name: string,
  description: string,
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
          id: dimension.id,
          name: dimension.name || getDimensionName(dimension.id),
          description: dimension.description || '',
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [data],
  );

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="field-dimension-section">
      <Heading size="small">{TEXT.title}</Heading>
      <Table
        className="field-dimension-section__table"
        data={rows}
        headers={HEADERS}
        renderRow={renderRow}
      />
    </div>
  );
}
