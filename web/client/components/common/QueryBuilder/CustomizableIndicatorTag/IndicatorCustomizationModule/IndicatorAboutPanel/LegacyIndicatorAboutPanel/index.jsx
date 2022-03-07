// @flow
import * as React from 'react';

import CategoryHierarchyPath from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/IndicatorAboutPanel/LegacyIndicatorAboutPanel/CategoryHierarchyPath';
import FieldService from 'services/wip/FieldService';
import FormulaText from 'components/DataCatalogApp/common/FormulaText';
import IndicatorAboutPanel from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/IndicatorAboutPanel';
import LoadingSpinner from 'components/ui/LoadingSpinner';
import useFieldFormula from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/IndicatorAboutPanel/LegacyIndicatorAboutPanel/useFieldFormula';
import { cancelPromise } from 'util/promiseUtil';
import type Field from 'models/core/wip/Field';
import type FieldMetadata from 'models/core/wip/FieldMetadata';

type Props = {
  fieldId: string,
  fieldMetadata: FieldMetadata,
};

// The LegacyIndicatorAboutPanel uses the FieldService and the legacy
// FieldInfoService to build out the "about" sections.
export default function LegacyIndicatorAboutPanel({
  fieldId,
  fieldMetadata,
}: Props): React.Node {
  const [field, setField] = React.useState<Field | void>(undefined);
  React.useEffect(() => {
    const promise = FieldService.get(fieldId).then(setField);
    return () => cancelPromise(promise);
  }, [fieldId]);

  const fieldFormula = useFieldFormula(fieldId);
  const formulaDisplay = React.useMemo(() => {
    if (fieldFormula === undefined) {
      return null;
    }

    return <FormulaText calculation={fieldFormula} enableFieldClick={false} />;
  }, [fieldFormula]);

  if (field === undefined) {
    return <LoadingSpinner />;
  }

  const category = fieldMetadata.category();
  return (
    <IndicatorAboutPanel
      calculation={field.calculation()}
      category={category.name()}
      categoryPath={<CategoryHierarchyPath category={category} />}
      dataSource={fieldMetadata.source().name()}
      defaultName={field.name()}
      description={fieldMetadata.description()}
      formulaDisplay={formulaDisplay}
    />
  );
}
