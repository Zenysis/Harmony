// @flow
import * as React from 'react';
import { useLazyLoadQuery } from 'react-relay/hooks';

import FieldCalculationSection from 'components/DataCatalogApp/FieldDetailsPage/FieldCalculationSection';
import FieldDetailsSection from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection';
import FieldDimensionSection from 'components/DataCatalogApp/FieldDetailsPage/FieldDimensionSection';
import FieldTitleSection from 'components/DataCatalogApp/FieldDetailsPage/FieldTitleSection';
import Heading from 'components/ui/Heading';
import Icon from 'components/ui/Icon';
import { localizeUrl } from 'util/util';
import type {
  FieldDetailsPageQuery,
  FieldDetailsPageQueryResponse,
} from './__generated__/FieldDetailsPageQuery.graphql';

const TEXT = {
  calculation: 'Calculation',
  indicator: 'Indicator',
  indicators: 'Indicators',
  indicatorDetails: 'Indicator Details',
  indicatorId: 'Indicator ID',
  dataSource: 'Data source',
  displayName: 'Display name',
};

type Props = {
  fieldId: string,
};

const MAIN_PAGE_URL = localizeUrl('/data-catalog');

export default function FieldDetailsPage({ fieldId }: Props): React.Node {
  const data: FieldDetailsPageQueryResponse = useLazyLoadQuery<FieldDetailsPageQuery>(
    graphql`
      query FieldDetailsPageQuery($id: ID!) {
        node(id: $id) {
          ... on field {
            ...FieldDetailsSection_field
            ...FieldDimensionSection_field
            ...FieldCalculationSection_field
            ...FieldTitleSection_field
          }
        }

        categoryConnection: category_connection {
          ...FieldDetailsSection_categoryConnection
          ...FieldCalculationSection_categoryConnection
        }

        dimensionConnection: dimension_connection {
          ...FieldDetailsSection_dimensionConnection
        }

        fieldConnection: field_connection {
          ...FieldDetailsSection_fieldConnection
          ...FieldCalculationSection_fieldConnection
        }
      }
    `,
    { id: fieldId },
  );

  return (
    <div className="field-details-page">
      <div className="field-details-page__nav-section">
        <a
          className="field-details-page__previous-page-button"
          href={MAIN_PAGE_URL}
        >
          <Icon type="svg-arrow-back" />
          <Heading
            className="field-details-page__arrow-back-text"
            size={Heading.Sizes.SMALL}
          >
            {TEXT.indicators}
          </Heading>
        </a>
      </div>
      {data.node && <FieldTitleSection field={data.node} />}
      {data.node && (
        <FieldDetailsSection
          categoryConnection={data.categoryConnection}
          dimensionConnection={data.dimensionConnection}
          field={data.node}
          fieldConnection={data.fieldConnection}
        />
      )}
      {data.node && (
        <FieldCalculationSection
          categoryConnection={data.categoryConnection}
          field={data.node}
          fieldConnection={data.fieldConnection}
        />
      )}
      {data.node && <FieldDimensionSection field={data.node} />}
    </div>
  );
}
