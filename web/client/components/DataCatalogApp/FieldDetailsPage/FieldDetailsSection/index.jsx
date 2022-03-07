// @flow
import * as React from 'react';
import { useFragment } from 'react-relay/hooks';

import CalculationRow from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/CalculationRow';
import CategoryRow from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/CategoryRow';
import DatasourceRow from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/DatasourceRow';
import DescriptionRow from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/DescriptionRow';
import FieldIdRow from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/FieldIdRow';
import Heading from 'components/ui/Heading';
import NameRow from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/NameRow';
import ShortNameRow from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/ShortNameRow';
import VisibilityRow from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/VisibilityRow';
import type { FieldDetailsSection_categoryConnection$key } from './__generated__/FieldDetailsSection_categoryConnection.graphql';
import type { FieldDetailsSection_dimensionConnection$key } from './__generated__/FieldDetailsSection_dimensionConnection.graphql';
import type { FieldDetailsSection_field$key } from './__generated__/FieldDetailsSection_field.graphql';
import type { FieldDetailsSection_fieldConnection$key } from './__generated__/FieldDetailsSection_fieldConnection.graphql';

type Props = {
  categoryConnection: FieldDetailsSection_categoryConnection$key,
  dimensionConnection: FieldDetailsSection_dimensionConnection$key,
  field: FieldDetailsSection_field$key,
  fieldConnection: FieldDetailsSection_fieldConnection$key,
};

const TEXT = {
  title: 'Indicator Details',
};

function FieldDetailsSection({
  categoryConnection,
  dimensionConnection,
  field,
  fieldConnection,
}: Props): React.Node {
  const data = useFragment(
    graphql`
      fragment FieldDetailsSection_field on field {
        ...CalculationRow_field
        ...CategoryRow_field
        ...DatasourceRow_field
        ...DescriptionRow_field
        ...NameRow_field
        ...VisibilityRow_field
        ...ShortNameRow_field
        ...FieldIdRow_field
      }
    `,
    field,
  );
  const categories = useFragment(
    graphql`
      fragment FieldDetailsSection_categoryConnection on categoryConnection {
        ...CategoryRow_categoryConnection
      }
    `,
    categoryConnection,
  );

  const dimensions = useFragment(
    graphql`
      fragment FieldDetailsSection_dimensionConnection on dimensionConnection {
        ...CalculationRow_dimensionConnection
      }
    `,
    dimensionConnection,
  );

  const fields = useFragment(
    graphql`
      fragment FieldDetailsSection_fieldConnection on fieldConnection {
        ...CategoryRow_fieldConnection
      }
    `,
    fieldConnection,
  );

  return (
    <div className="field-details-section">
      <Heading size="small">{TEXT.title}</Heading>
      <div className="field-details-section__list">
        <FieldIdRow field={data} />
        <NameRow field={data} />
        <ShortNameRow field={data} />
        <DescriptionRow field={data} />
        <DatasourceRow field={data} />
        <CategoryRow
          categoryConnection={categories}
          field={data}
          fieldConnection={fields}
        />
        <CalculationRow dimensionConnection={dimensions} field={data} />
        <VisibilityRow field={data} />
      </div>
    </div>
  );
}

export default (React.memo<Props>(
  FieldDetailsSection,
): React.AbstractComponent<Props>);
