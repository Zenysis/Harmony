// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import CursorPosition from 'models/QueryResult/QueryResultActionButtons/CustomCalculationsModal/CursorPosition';
import Group from 'components/ui/Group';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import QueryPartSelector from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock/QueryPartSelector';
import Tag from 'components/ui/Tag';
import type FormulaCursor from 'models/QueryResult/QueryResultActionButtons/CustomCalculationsModal/FormulaCursor';
import type FormulaMetadata from 'models/core/Field/CustomField/Formula/FormulaMetadata';
import type { NamedItem } from 'models/ui/HierarchicalSelector/types';

type Props = {
  formulaCursor: FormulaCursor,
  formulaMetadata: FormulaMetadata,
  hierarchyRoot: HierarchyItem<NamedItem>,
  onFormulaCursorChange: (formula: FormulaCursor) => void,
  onFormulaMetadataChange: (cursor: FormulaMetadata) => void,
  onSelectedItemsChange: (
    selectedItems: $ReadOnlyArray<HierarchyItem<NamedItem>>,
  ) => void,
  selectedItems: $ReadOnlyArray<HierarchyItem<NamedItem>>,
};

const TEXT = {
  allIndicators: 'All indicators',
  title: 'Fields',
};

function columnTitleGenerator(item: HierarchyItem<NamedItem>): string {
  return item.isHierarchyRoot() ? TEXT.allIndicators : item.name();
}

function onMenuOpen() {
  analytics.track('Open Hierarchical Selector');
}

export default function FieldsSection({
  formulaCursor,
  formulaMetadata,
  hierarchyRoot,
  onFormulaCursorChange,
  onFormulaMetadataChange,
  onSelectedItemsChange,
  selectedItems,
}: Props): React.Element<typeof Group.Vertical> {
  const onFieldClick = (item: HierarchyItem<NamedItem>) => {
    const label = item.name();
    const newFormula = formulaMetadata.addField(
      {
        fieldId: item.id(),
        fieldLabel: label,
        treatNoDataAsZero: false,
      },
      formulaCursor,
    );
    onFormulaMetadataChange(newFormula);

    const start = formulaCursor.start();
    const newPosition = CursorPosition.create({
      lineNumber: start.lineNumber(),
      offset: start.offset() + label.length,
    });
    const newCursor = formulaCursor.start(newPosition).collapseToStart();
    onFormulaCursorChange(newCursor);
  };

  const onItemSelect = React.useCallback(
    (item: HierarchyItem<NamedItem>) => {
      const itemId = item.id();
      if (selectedItems.some(i => i.id() === itemId)) {
        return;
      }

      onSelectedItemsChange([...selectedItems, item]);
    },
    [onSelectedItemsChange, selectedItems],
  );

  const onTagRemoveClick = (itemToRemove: HierarchyItem<NamedItem>) => {
    const updatedItems = selectedItems.filter(
      item => item.id() !== itemToRemove.id(),
    );
    onSelectedItemsChange(updatedItems);
  };

  const unselectableItems = React.useMemo(
    () => Zen.Array.create(selectedItems.map(item => item.id())),
    [selectedItems],
  );

  const fieldTags = selectedItems.map(item => (
    <Tag
      key={item.id()}
      onClick={onFieldClick}
      onRequestRemove={onTagRemoveClick}
      removable
      size={Tag.Sizes.SMALL}
      value={item}
    >
      {item.name()}
    </Tag>
  ));

  const fieldsContainer = (
    <Group.Vertical className="fields-section__fields-container" spacing="xxs">
      {fieldTags}
    </Group.Vertical>
  );

  const title = <div className="fields-section__title">{TEXT.title}</div>;

  return (
    <Group.Vertical>
      {title}
      {fieldsContainer}
      <QueryPartSelector
        columnTitleGenerator={columnTitleGenerator}
        enableSearch
        hierarchyRoot={hierarchyRoot}
        onItemSelect={onItemSelect}
        onMenuOpen={onMenuOpen}
        unselectableItems={unselectableItems}
      />
    </Group.Vertical>
  );
}
