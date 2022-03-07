// @flow
import * as React from 'react';
import { useFragment } from 'react-relay/hooks';

import CategoryPath from 'components/DataCatalogApp/common/CategoryPath';
import FormulaText from 'components/DataCatalogApp/common/FormulaText';
import IndicatorAboutPanel from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/IndicatorAboutPanel';
import useFieldCalculation from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/CalculationRow/useFieldCalculation';
import type FormulaCalculation from 'models/core/wip/Calculation/FormulaCalculation';
import type { FieldAboutPanelContent_field$key } from './__generated__/FieldAboutPanelContent_field.graphql';

type Props = {
  fieldFragmentRef: FieldAboutPanelContent_field$key,

  // HACK(stephen): The non-DataCatalog version of the about panel receives its
  // formula from the backend. This allows it to render a formula for
  // *composite indicators*. Composite indicators use normal calculations (like
  // SUM, LAST_VALUE) and can combine multiple fields purely by adjusting the
  // calculation filter. DataCatalog does not have insight into what is a
  // composite indicator in the same way as the non-DataCatalog version does. To
  // try and maintain backwards compatibility, we require a formula calculation
  // to be passed in that will handle the case of FormulaCalculation being the
  // native calculation type for a field *or* the native calculation beinga a
  // composite indicator.
  formulaCalculationForDisplay: FormulaCalculation | void,
};

export default function FieldAboutPanelContent({
  fieldFragmentRef,
  formulaCalculationForDisplay,
}: Props): React.Node {
  const data = useFragment(
    graphql`
      fragment FieldAboutPanelContent_field on field {
        name
        description
        fieldCategoryMappings: field_category_mappings {
          category {
            id
            name
          }
        }

        fieldPipelineDatasourceMappings: field_pipeline_datasource_mappings {
          pipelineDatasource: pipeline_datasource {
            id
            name
          }
        }

        ...useFieldCalculation_field
      }
    `,
    fieldFragmentRef,
  );

  const calculation = useFieldCalculation(data);

  const formulaDisplay = React.useMemo(() => {
    if (formulaCalculationForDisplay === undefined) {
      return null;
    }

    return (
      <FormulaText
        calculation={formulaCalculationForDisplay}
        enableFieldClick={false}
      />
    );
  }, [formulaCalculationForDisplay]);

  // Convert the list of datasources for this field into a single string.
  const dataSources = React.useMemo(
    () =>
      data.fieldPipelineDatasourceMappings
        .map(({ pipelineDatasource }) => pipelineDatasource.name)
        .join(', '),
    [data],
  );

  // Only allow one category at this time for a field. While it is technically
  // possible for a field to reside in multiple categories, it is not yet in
  // use.
  const { category } = data.fieldCategoryMappings[0] || {};
  const categoryPath = React.useMemo(
    () => (category !== undefined ? <CategoryPath id={category.id} /> : null),
    [category],
  );

  return (
    <IndicatorAboutPanel
      calculation={calculation}
      category={category.name}
      categoryPath={categoryPath}
      dataSource={dataSources}
      defaultName={data.name}
      description={data.description || ''}
      formulaDisplay={formulaDisplay}
    />
  );
}
