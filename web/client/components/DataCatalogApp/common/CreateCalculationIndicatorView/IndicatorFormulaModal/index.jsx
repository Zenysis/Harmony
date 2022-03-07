// @flow
import * as React from 'react';
import { useFragment } from 'react-relay/hooks';

import BaseModal from 'components/ui/BaseModal';
import Constituent from 'models/core/wip/Calculation/FormulaCalculation/Constituent';
import CursorPosition from 'models/QueryResult/QueryResultActionButtons/CustomCalculationsModal/CursorPosition';
import FieldsSection from 'components/DataCatalogApp/common/CreateCalculationIndicatorView/IndicatorFormulaModal/FieldsSection';
import FormulaCalculation from 'models/core/wip/Calculation/FormulaCalculation';
import FormulaCursor from 'models/QueryResult/QueryResultActionButtons/CustomCalculationsModal/FormulaCursor';
import FormulaMetadata from 'models/core/Field/CustomField/Formula/FormulaMetadata';
import FormulaSection from 'components/DataCatalogApp/common/CreateCalculationIndicatorView/IndicatorFormulaModal/FormulaSection';
import Group from 'components/ui/Group';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import splitFormulaIntoTokens from 'components/DataCatalogApp/FieldDetailsPage/FieldCalculationSection/splitFormulaIntoTokens';
import { databaseIdToRelayId, relayIdToDatabaseId } from 'util/graphql';
import type { IndicatorFormulaModal_fieldConnection$key } from './__generated__/IndicatorFormulaModal_fieldConnection.graphql';
import type { NamedItem } from 'models/ui/HierarchicalSelector/types';

const TEXT = {
  cancel: 'cancel',
  save: 'save',
  title: 'Define formula',
};

type Props = {
  fieldConnection: IndicatorFormulaModal_fieldConnection$key,
  formulaCalculation: FormulaCalculation,
  hierarchyRoot: HierarchyItem<NamedItem>,
  onCloseModal: () => void,
  onFormulaCalculationChange: (formulaCalculation: FormulaCalculation) => void,
  show: boolean,
};

// Load selected items from formulaCalculation prop.
function loadSelectedItems(
  formulaCalculation: FormulaCalculation,
): $ReadOnlyArray<HierarchyItem<NamedItem>> {
  const visitedIds = new Set();
  const selectedItems = [];
  formulaCalculation.constituents().forEach(constituent => {
    const constituentId = constituent.id();
    if (!visitedIds.has(constituentId)) {
      visitedIds.add(constituentId);
      const id = databaseIdToRelayId(constituentId, 'field');
      const name = constituent.name();
      selectedItems.push(
        HierarchyItem.create({
          id,
          metadata: {
            id,
            name: () => name,
            shortName: () => name,
          },
        }),
      );
    }
  });
  return selectedItems;
}

// Configure formula cursor from formula metadata.
function configureFormulaCursor(
  formulaMetadata: FormulaMetadata,
): FormulaCursor {
  const startPosition = CursorPosition.create({
    lineNumber: formulaMetadata.lines().size() - 1,
    offset: formulaMetadata.lines().last().length,
  });
  return FormulaCursor.create({ start: startPosition }).collapseToStart();
}

const DEFAULT_FORMULA_METADATA = FormulaMetadata.create({});
const DEFAULT_FORMULA_CURSOR = FormulaCursor.create({});

export default function IndicatorFormulaModal({
  fieldConnection,
  formulaCalculation,
  hierarchyRoot,
  onCloseModal,
  onFormulaCalculationChange,
  show,
}: Props): React.Element<typeof BaseModal> {
  const [formulaMetadata, setFormulaMetadata] = React.useState<FormulaMetadata>(
    DEFAULT_FORMULA_METADATA,
  );
  const [formulaCursor, setFormulaCursor] = React.useState<FormulaCursor>(
    DEFAULT_FORMULA_CURSOR,
  );
  // selectedItems is only used by FieldsSection. It is maintained here so that
  // we can preserve the values when IndicatorFormulaModal is closed.
  const [selectedItems, setSelectedItems] = React.useState<
    $ReadOnlyArray<HierarchyItem<NamedItem>>,
  >([]);

  React.useEffect(() => {
    const newFormulaMetadata = formulaCalculation.createFormulaMetadata();
    setFormulaMetadata(newFormulaMetadata);
    setFormulaCursor(configureFormulaCursor(newFormulaMetadata));
    setSelectedItems(loadSelectedItems(formulaCalculation));
  }, [formulaCalculation]);

  const data = useFragment(
    graphql`
      fragment IndicatorFormulaModal_fieldConnection on fieldConnection {
        edges {
          node {
            id
            name
            serializedCalculation: calculation
          }
        }
      }
    `,
    fieldConnection,
  );

  const getFieldConstituentsFromData = (fieldIds: $ReadOnlySet<string>) =>
    data.edges
      .filter(({ node }) => fieldIds.has(node.id))
      .map(({ node }) =>
        Constituent.UNSAFE_deserialize({
          calculation: node.serializedCalculation,
          id: relayIdToDatabaseId(node.id),
          name: node.name,
        }),
      );

  // Get formula expression with database ids.
  const getFinalFormulaExpression = (expression: string) => {
    const fieldIds = new Set();
    const pieces = splitFormulaIntoTokens(expression).map(({ type, value }) => {
      if (type !== 'field') {
        return value;
      }
      // Store the relay field ID so we can build a constituent calculation for it.
      fieldIds.add(value);
      // Replace the field's relay ID with the actual database ID value we want to store.
      return relayIdToDatabaseId(value);
    });
    return { expression: pieces.join(''), fieldIds };
  };

  const onSaveClick = () => {
    const { expression, fieldIds } = getFinalFormulaExpression(
      formulaMetadata.getBackendFormulaText(),
    );
    const constituents = getFieldConstituentsFromData(fieldIds);
    const updatedFormulaCalculation = formulaCalculation
      .expression(expression)
      .constituents(constituents);
    onFormulaCalculationChange(updatedFormulaCalculation);
    onCloseModal();
  };

  // Do not save invalid or empty formulas
  const disableSaveButton =
    !formulaMetadata.isValid() || formulaMetadata.fields().isEmpty();

  return (
    <BaseModal
      disablePrimaryButton={disableSaveButton}
      onPrimaryAction={onSaveClick}
      onRequestClose={onCloseModal}
      maxWidth={790}
      primaryButtonText={TEXT.save}
      secondaryButtonText={TEXT.cancel}
      show={show}
      title={TEXT.title}
    >
      <Group.Horizontal
        firstItemClassName="indicator-formula-modal__fields-section"
        flex
        lastItemClassName="indicator-formula-modal__formula-section"
      >
        <FieldsSection
          formulaCursor={formulaCursor}
          formulaMetadata={formulaMetadata}
          hierarchyRoot={hierarchyRoot}
          onFormulaCursorChange={setFormulaCursor}
          onFormulaMetadataChange={setFormulaMetadata}
          onSelectedItemsChange={setSelectedItems}
          selectedItems={selectedItems}
        />
        <FormulaSection
          formulaCursor={formulaCursor}
          formulaMetadata={formulaMetadata}
          onFormulaCursorChange={setFormulaCursor}
          onFormulaMetadataChange={setFormulaMetadata}
        />
      </Group.Horizontal>
    </BaseModal>
  );
}
