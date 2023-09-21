// @flow
import * as React from 'react';

import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import MappingTableGroup from 'components/DataUploadApp/AddDataModal/MappingPage/MappingTableGroup';
import ToggleSwitch from 'components/ui/ToggleSwitch';
import useToggleBoolean from 'lib/hooks/useToggleBoolean';
import { COLUMN_TYPE_ORDER } from 'models/DataUploadApp/registry';
import { DataUploadModalContext } from 'components/DataUploadApp/AddDataModal/useDataUploadModalContext';
import { getTypeSpecificError } from 'components/DataUploadApp/util';
import type Dimension from 'models/core/wip/Dimension';
import type Field from 'models/core/wip/Field';
import type HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import type LinkedCategory from 'models/core/wip/LinkedCategory';
import type { ColumnType } from 'models/DataUploadApp/types';

type Props = {
  dimensionHierarchyRoot: HierarchyItem<LinkedCategory | Dimension>,
  fieldHierarchyRoot: HierarchyItem<LinkedCategory | Field>,
  setDisableCompleteButton: boolean => void,
};

export default function MappingPage({
  dimensionHierarchyRoot,
  fieldHierarchyRoot,
  setDisableCompleteButton,
}: Props): React.Node {
  // $SingleInputSourceHack: Which file summary is being mapped should be passed in.
  const { fileSummaries } = React.useContext(DataUploadModalContext);
  const { columnMapping, columnOrder } = fileSummaries.values()[0];
  const [showIgnored, _toggleShowIgnored] = useToggleBoolean(false);
  const [showOnlyErrors, _toggleShowOnlyErrors] = useToggleBoolean(false);

  // NOTE: This is tracked here because cards move in between groups, so multiple
  // MappingTableGroups need access.
  const [movedCard, setMovedCard] = React.useState<string | void>(undefined);
  const [movedGroupType, setMovedGroupType] = React.useState<ColumnType | void>(
    undefined,
  );

  // Don't want cards to re-animate on toggle, so reset movedCard.
  const toggleShowIgnored = () => {
    setMovedCard(undefined);
    _toggleShowIgnored();
  };
  const toggleShowOnlyErrors = () => {
    setMovedCard(undefined);
    _toggleShowOnlyErrors();
  };

  React.useEffect(() => {
    setDisableCompleteButton(
      // Check both if any individual cards have errors as well as the whole group error checks.
      // If any of those have an error, disable the complete button.
      columnMapping.some(column => column.isInvalid()) ||
        Object.keys(columnOrder).some(columnType => {
          const unignoredColumns = columnOrder[columnType]
            .map(columnName => columnMapping.forceGet(columnName))
            .filter(column => !column.ignoreColumn());
          return getTypeSpecificError(columnType, unignoredColumns) !== null;
        }),
    );
  }, [columnMapping, columnOrder, setDisableCompleteButton]);

  const table = (
    <div className="data-upload-mapping-page__table">
      {COLUMN_TYPE_ORDER.map(columnType => (
        <MappingTableGroup
          key={columnType}
          columnMapping={columnMapping.filter(
            column => column.columnType() === columnType,
          )}
          columnOrder={columnOrder[columnType]}
          dimensionHierarchyRoot={dimensionHierarchyRoot}
          fieldHierarchyRoot={fieldHierarchyRoot}
          movedCard={movedCard}
          movedGroupType={movedGroupType}
          setMovedCard={setMovedCard}
          setMovedGroupType={setMovedGroupType}
          showIgnored={showIgnored}
          showOnlyErrors={showOnlyErrors}
          type={columnType}
        />
      ))}
    </div>
  );

  return (
    <div className="data-upload-mapping-page">
      <Group.Horizontal
        firstItemFlexValue={1}
        flex
        marginBottom="l"
        spacing="l"
      >
        <Heading.Small>
          <I18N>Complete Zenysis base format</I18N>
        </Heading.Small>
        <ToggleSwitch
          displayLabels="right"
          label={I18N.text('Show ignored columns')}
          onChange={toggleShowIgnored}
          value={showIgnored}
        />
        <ToggleSwitch
          displayLabels="right"
          label={I18N.text('Show only columns with issues')}
          onChange={toggleShowOnlyErrors}
          value={showOnlyErrors}
        />
      </Group.Horizontal>
      {table}
    </div>
  );
}
