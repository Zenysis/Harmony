// @flow
import * as React from 'react';
import classNames from 'classnames';

import * as Zen from 'lib/Zen';
import Colors from 'components/ui/Colors';
import ColumnCard from 'components/DataUploadApp/AddDataModal/MappingPage/Cards/ColumnCard';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import Spacing from 'components/ui/Spacing';
import { getTypeSpecificError } from 'components/DataUploadApp/util';
import type ColumnSpec from 'models/DataUploadApp/ColumnSpec';
import type Dimension from 'models/core/wip/Dimension';
import type Field from 'models/core/wip/Field';
import type HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import type LinkedCategory from 'models/core/wip/LinkedCategory';
import type { ColumnType } from 'models/DataUploadApp/types';

const TITLE_MAP = Object.freeze({
  DATE: I18N.text('Date'),
  DIMENSION: I18N.text('Group Bys'),
  FIELD: I18N.textById('Indicators'),
});

type Props = {
  columnMapping: Zen.Map<ColumnSpec>,
  columnOrder: $ReadOnlyArray<string>,

  dimensionHierarchyRoot: HierarchyItem<LinkedCategory | Dimension>,
  fieldHierarchyRoot: HierarchyItem<LinkedCategory | Field>,

  // NOTE: These keep track of whether a card has been moved in between groups.
  // `movedCard` tracks the name of the moved card and `movedGroupType` tracks which group it was
  // moved to. They are undefined if no card has been moved. These are necessary for animations
  // (autoscrolling and css) showing where the card has moved.
  movedCard: string | void,
  movedGroupType: ColumnType | void,
  setMovedCard: (string | void) => void,
  setMovedGroupType: (ColumnType | void) => void,

  showIgnored: boolean,
  showOnlyErrors: boolean,
  type: ColumnType,
};

export default function MappingTableGroup({
  columnMapping,
  columnOrder,
  dimensionHierarchyRoot,
  fieldHierarchyRoot,
  movedCard,
  movedGroupType,
  setMovedCard,
  setMovedGroupType,
  showIgnored,
  showOnlyErrors,
  type,
}: Props): React.Node {
  const cardsRef = React.useRef(null);

  // Autoscroll to the top of a group when a card has been moved to that group.
  React.useEffect(() => {
    if (movedGroupType === type && cardsRef?.current) {
      cardsRef.current.scrollTo({ behavior: 'smooth', top: 0 });
    }
    // NOTE: Including columnOrder here for the case when multiple cards are moved to the
    // same group in a row (so movedGroupType and type won't have changed).
  }, [columnOrder, movedGroupType, type]);

  const unignoredColumns = columnMapping.filter(
    column => !column.ignoreColumn(),
  );

  const renderTypeSpecificError = () => {
    const errorMessage = getTypeSpecificError(type, unignoredColumns.values());
    if (errorMessage === null) {
      return null;
    }

    return (
      <Spacing
        key="groupIssue"
        className="data-upload-type-groups__error-pill"
        marginBottom="xxxs"
      >
        {errorMessage}
      </Spacing>
    );
  };

  const numberErroredCards = columnMapping
    .values()
    .filter(column => column.isInvalid()).length;
  const errorPills = (
    <React.Fragment>
      {renderTypeSpecificError()}
      {numberErroredCards !== 0 && (
        <div key="cardIssue" className="data-upload-type-groups__error-pill">
          <I18N
            numberErroredCards={numberErroredCards}
            pluralizedIssues={
              numberErroredCards === 1
                ? I18N.text('issue')
                : I18N.text('issues')
            }
          >
            %(numberErroredCards)s column %(pluralizedIssues)s
          </I18N>
        </div>
      )}
    </React.Fragment>
  );

  const numberUnignoredColumns = unignoredColumns.size();
  const numberIgnoredColumns = columnMapping.size() - unignoredColumns.size();
  const header = (
    <Group.Horizontal
      alignItems="center"
      className="u-caption-text data-upload-type-groups__header"
      flex
      justifyContent="space-between"
      spacing="xs"
    >
      <Group.Item>
        <Heading.Small>{TITLE_MAP[type]}</Heading.Small>
        <Group.Horizontal marginTop="xxs" spacing="xs">
          <I18N
            numberUnignoredColumns={numberUnignoredColumns}
            pluralizedColumns={
              numberUnignoredColumns === 1
                ? I18N.text('column')
                : I18N.text('columns')
            }
          >
            %(numberUnignoredColumns)s %(pluralizedColumns)s
          </I18N>
          {numberIgnoredColumns !== 0 && (
            <svg height="8" width="4">
              <circle cx="2" cy="4" fill={Colors.GRAY} r="2" />
            </svg>
          )}
          {numberIgnoredColumns !== 0 && (
            <I18N numberIgnoredColumns={numberIgnoredColumns}>
              %(numberIgnoredColumns)s ignored
            </I18N>
          )}
        </Group.Horizontal>
      </Group.Item>
      <Group.Item>{errorPills}</Group.Item>
    </Group.Horizontal>
  );

  const cards = columnOrder.map(columnName => {
    const column = columnMapping.forceGet(columnName);
    if (
      (!showIgnored && column.ignoreColumn()) ||
      (showOnlyErrors && !column.error())
    ) {
      return null;
    }

    return (
      <ColumnCard
        key={column.name()}
        column={column}
        dimensionHierarchyRoot={dimensionHierarchyRoot}
        fieldHierarchyRoot={fieldHierarchyRoot}
        movedCard={movedCard}
        setMovedCard={setMovedCard}
        setMovedGroupType={setMovedGroupType}
      />
    );
  });

  const cardsClass = classNames('data-upload-type-groups__cards', {
    'data-upload-type-groups__cards--highlighted': type === movedGroupType,
  });

  return (
    <div className="data-upload-type-groups">
      {header}
      <div ref={cardsRef} className={cardsClass}>
        {cards}
      </div>
    </div>
  );
}
