// @flow
import * as React from 'react';
import { useFragment } from 'react-relay/hooks';

import IndicatorFormulaModal from 'components/DataCatalogApp/common/CreateCalculationIndicatorView/IndicatorFormulaModal';
import useFilterHierarchy from 'components/DataCatalogApp/common/hooks/useFilterHierarchy';
import type FormulaCalculation from 'models/core/wip/Calculation/FormulaCalculation';
import type { IndicatorFormulaModalWrapper_categoryConnection$key } from './__generated__/IndicatorFormulaModalWrapper_categoryConnection.graphql';
import type { IndicatorFormulaModalWrapper_fieldConnection$key } from './__generated__/IndicatorFormulaModalWrapper_fieldConnection.graphql';

type Props = {
  calculation: FormulaCalculation,
  categoryConnection: IndicatorFormulaModalWrapper_categoryConnection$key,
  fieldConnection: IndicatorFormulaModalWrapper_fieldConnection$key,
  onCloseModal: () => void,
  onFormulaCalculationChange: FormulaCalculation => void,
  show: boolean,
};

function IndicatorFormulaModalWrapper({
  calculation,
  categoryConnection,
  fieldConnection,
  onCloseModal,
  onFormulaCalculationChange,
  show,
}: Props): React.Element<typeof IndicatorFormulaModal> {
  const fields = useFragment(
    graphql`
      fragment IndicatorFormulaModalWrapper_fieldConnection on fieldConnection {
        ...useFilterHierarchy_fieldConnection
        ...IndicatorFormulaModal_fieldConnection
      }
    `,
    fieldConnection,
  );

  const categories = useFragment(
    graphql`
      fragment IndicatorFormulaModalWrapper_categoryConnection on categoryConnection {
        ...useFilterHierarchy_categoryConnection
      }
    `,
    categoryConnection,
  );

  const [hierarchyRoot] = useFilterHierarchy(categories, fields);

  return (
    <IndicatorFormulaModal
      fieldConnection={fields}
      formulaCalculation={calculation}
      hierarchyRoot={hierarchyRoot}
      onCloseModal={onCloseModal}
      onFormulaCalculationChange={onFormulaCalculationChange}
      show={show}
    />
  );
}

export default (React.memo<Props>(
  IndicatorFormulaModalWrapper,
): React.AbstractComponent<Props>);
