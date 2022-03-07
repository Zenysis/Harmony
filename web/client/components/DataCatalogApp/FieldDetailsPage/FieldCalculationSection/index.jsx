// @flow
import * as React from 'react';
import { useFragment, useMutation } from 'react-relay/hooks';

import FormulaText from 'components/DataCatalogApp/common/FormulaText';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import IndicatorFormulaModalWrapper from 'components/DataCatalogApp/FieldDetailsPage/FieldCalculationSection/IndicatorFormulaModalWrapper';
import useBoolean from 'lib/hooks/useBoolean';
import useFieldCalculation from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/CalculationRow/useFieldCalculation';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import { relayIdToDatabaseId } from 'util/graphql';
import type FormulaCalculation from 'models/core/wip/Calculation/FormulaCalculation';
import type { FieldCalculationSectionMutation } from './__generated__/FieldCalculationSectionMutation.graphql';
import type { FieldCalculationSection_categoryConnection$key } from './__generated__/FieldCalculationSection_categoryConnection.graphql';
import type { FieldCalculationSection_field$key } from './__generated__/FieldCalculationSection_field.graphql';
import type { FieldCalculationSection_fieldConnection$key } from './__generated__/FieldCalculationSection_fieldConnection.graphql';

type Props = {
  categoryConnection: FieldCalculationSection_categoryConnection$key,
  field: FieldCalculationSection_field$key,
  fieldConnection: FieldCalculationSection_fieldConnection$key,
};

function FieldCalculationSection({
  categoryConnection,
  field,
  fieldConnection,
}: Props): React.Node {
  const [showValidator, setShowValidator] = React.useState<boolean>(false);

  // Loading js interpreter here for the indicator formula modal formula validator.
  React.useEffect(() => {
    VENDOR_SCRIPTS.jsInterpreter.load().then(() => {
      setShowValidator(true);
    });
  }, []);

  const data = useFragment(
    graphql`
      fragment FieldCalculationSection_field on field {
        fieldId: id
        fieldName: name
        ...useFieldCalculation_field
      }
    `,
    field,
  );
  const categories = useFragment<FieldCalculationSection_categoryConnection$key>(
    graphql`
      fragment FieldCalculationSection_categoryConnection on categoryConnection {
        ...IndicatorFormulaModalWrapper_categoryConnection
      }
    `,
    categoryConnection,
  );
  const fields = useFragment<FieldCalculationSection_fieldConnection$key>(
    graphql`
      fragment FieldCalculationSection_fieldConnection on fieldConnection {
        ...IndicatorFormulaModalWrapper_fieldConnection
      }
    `,
    fieldConnection,
  );

  const [isEditModalOpen, openModal, closeModal] = useBoolean(false);
  const [commit] = useMutation<FieldCalculationSectionMutation>(
    graphql`
      mutation FieldCalculationSectionMutation(
        $dbId: String!
        $newCalculation: jsonb!
      ) {
        update_field_by_pk(
          pk_columns: { id: $dbId }
          _set: { calculation: $newCalculation }
        ) {
          id
          calculation
        }
      }
    `,
  );

  const { fieldId, fieldName } = data;
  const calculation = useFieldCalculation(data);

  const onSaveCalculation = React.useCallback(
    (newCalculation: FormulaCalculation) => {
      const serializedCalculation = newCalculation.serialize();
      commit({
        variables: {
          dbId: relayIdToDatabaseId(fieldId),
          newCalculation: serializedCalculation,
        },
      });
      analytics.track('Edit calculation in indicator details page');
    },
    [commit, fieldId],
  );

  if (calculation.tag !== 'FORMULA' && calculation.tag !== 'COHORT') {
    return null;
  }

  const formulaDisplay = (
    <FormulaText
      calculation={calculation}
      className="field-formula-section__formula-text"
    />
  );

  const editModal = (
      <IndicatorFormulaModalWrapper
        categoryConnection={categories}
        fieldConnection={fields}
        calculation={calculation}
        onCloseModal={closeModal}
        onFormulaCalculationChange={onSaveCalculation}
        show={isEditModalOpen}
      />
    );

  const editButton = (
    <div onClick={openModal} role="button">
      <Group.Horizontal className="field-overview-page__button" spacing="xs">
        <Icon type="pencil" />
          <I18N>Edit formula</I18N>
      </Group.Horizontal>
    </div>
  );

  return (
    <div className="field-formula-section">
      <div className="field-formula-section__heading">
        <Heading size="small">
          <I18N>Formula</I18N>
        </Heading>
        <div className="field-formula-section__edit-button">{editButton}</div>
      </div>
      <div className="field-formula-section__formula-block">
        {formulaDisplay}
      </div>
      {showValidator && editModal}
    </div>
  );
}

export default (React.memo<Props>(
  FieldCalculationSection,
): React.AbstractComponent<Props>);
