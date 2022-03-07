// @flow
import * as React from 'react';
import { useFragment } from 'react-relay/hooks';

import IndicatorFormulaModal from 'components/DataCatalogApp/common/CreateCalculationIndicatorView/IndicatorFormulaModal';
import useDimensionValueMap from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/FilterSelectionBlock/useDimensionValueMap';
import useFieldHierarchy from 'components/DataCatalogApp/common/hooks/aqt/useFieldHierarchy';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import type Dimension from 'models/core/wip/Dimension';
import type HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import type { Calculation } from 'models/core/wip/Calculation/types';
import type { EditCalculationView_categoryConnection$key } from './__generated__/EditCalculationView_categoryConnection.graphql';
import type { EditCalculationView_fieldConnection$key } from './__generated__/EditCalculationView_fieldConnection.graphql';
import type { NamedItem } from 'models/ui/HierarchicalSelector/types';

type Props = {
  calculation: Calculation,
  categoryConnection: EditCalculationView_categoryConnection$key,
  dimensions: $ReadOnlyArray<Dimension>,
  fieldConnection: EditCalculationView_fieldConnection$key,
  fieldName: string,
  hierarchyRoot: HierarchyItem<NamedItem>,
  onCalculationChange: (calculation: Calculation) => void,
  onCloseModal: () => void,
  show: boolean,
};

export default function EditCalculationView({
  calculation,
  categoryConnection,
  dimensions,
  fieldConnection,
  fieldName,
  hierarchyRoot,
  onCalculationChange,
  onCloseModal,
  show,
}: Props): React.Element<
  typeof IndicatorFormulaModal,
> | null {
  const [showValidator, setShowValidator] = React.useState<boolean>(false);
  // Loading js interpreter here for the indicator formula modal formula validator.
  React.useEffect(() => {
    VENDOR_SCRIPTS.jsInterpreter.load().then(() => {
      setShowValidator(true);
    });
  }, []);

  const categories = useFragment(
    graphql`
      fragment EditCalculationView_categoryConnection on categoryConnection {
        ...useFieldHierarchy_categoryConnection
      }
    `,
    categoryConnection,
  );

  const fields = useFragment(
    graphql`
      fragment EditCalculationView_fieldConnection on fieldConnection {
        ...IndicatorFormulaModal_fieldConnection
        ...useFieldHierarchy_fieldConnection
      }
    `,
    fieldConnection,
  );

  const [fieldHierarchyRoot, trackFieldItemSelected] = useFieldHierarchy(
    categories,
    fields,
  );

  const dimensionValueMap = useDimensionValueMap();

  if (calculation.tag === 'FORMULA' && showValidator) {
    return (
      <IndicatorFormulaModal
        fieldConnection={fields}
        formulaCalculation={calculation}
        hierarchyRoot={hierarchyRoot}
        onCloseModal={onCloseModal}
        onFormulaCalculationChange={onCalculationChange}
        show={show}
      />
    );
  }
  return null;
}
