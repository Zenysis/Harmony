// @flow
import * as React from 'react';
import classNames from 'classnames';

import DateCardBody from 'components/DataUploadApp/AddDataModal/MappingPage/Cards/DateCardBody';
import FieldCardBody from 'components/DataUploadApp/AddDataModal/MappingPage/Cards/FieldCardBody';
import Group from 'components/ui/Group';
import GroupByCardBody from 'components/DataUploadApp/AddDataModal/MappingPage/Cards/GroupByCardBody';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import MenuDropdown from 'components/DataUploadApp/AddDataModal/MappingPage/Cards/MenuDropdown';
import { COLUMN_TYPE } from 'models/DataUploadApp/registry';
import type ColumnSpec from 'models/DataUploadApp/ColumnSpec';
import type Dimension from 'models/core/wip/Dimension';
import type Field from 'models/core/wip/Field';
import type HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import type LinkedCategory from 'models/core/wip/LinkedCategory';
import type { ColumnType } from 'models/DataUploadApp/types';

type Props = {
  column: ColumnSpec,
  dimensionHierarchyRoot: HierarchyItem<LinkedCategory | Dimension>,
  fieldHierarchyRoot: HierarchyItem<LinkedCategory | Field>,
  movedCard: string | void,
  setMovedCard: (string | void) => void,
  setMovedGroupType: (ColumnType | void) => void,
};

export default function ColumnCard({
  column,
  dimensionHierarchyRoot,
  fieldHierarchyRoot,
  movedCard,
  setMovedCard,
  setMovedGroupType,
}: Props): React.Node {
  const iconClassNames = classNames('data-upload-matching-card__state-icon', {
    'data-upload-matching-card__accept-state-icon': !column.error(),
    'data-upload-matching-card__error-state-icon': column.error(),
  });
  const statusIconType = column.error()
    ? 'svg-error-outline'
    : 'svg-check-circle-outline';
  const maybeRenderStatusIcon = !column.ignoreColumn() && (
    <Group.Item className="data-upload-matching-card__icon">
      <Icon className={iconClassNames} type={statusIconType} />
    </Group.Item>
  );

  const headerClassName = classNames({
    'data-upload-matching-card__header--ignored': column.ignoreColumn(),
  });
  const messageClassName = classNames('u-caption-text', {
    'data-upload-matching-card__message--ignored': column.ignoreColumn(),
  });

  const renderBody = () => {
    if (column.ignoreColumn()) {
      return <I18N>Column ignored</I18N>;
    }

    switch (column.columnType()) {
      case COLUMN_TYPE.DATE:
        return <DateCardBody column={column} />;
      case COLUMN_TYPE.FIELD:
        return (
          <FieldCardBody
            column={column}
            fieldHierarchyRoot={fieldHierarchyRoot}
          />
        );
      case COLUMN_TYPE.DIMENSION:
        return (
          <GroupByCardBody
            column={column}
            dimensionHierarchyRoot={dimensionHierarchyRoot}
          />
        );
      default:
        throw new Error(
          `[Card rendering] Invalid column type '${column.columnType()}'.`,
        );
    }
  };

  const cardClassName = classNames('data-upload-matching-card', {
    'data-upload-matching-card--highlighted': movedCard === column.name(),
  });
  return (
    <div className={cardClassName}>
      <Group.Horizontal flex paddingBottom="xxs" paddingLeft="s" spacing="xxs">
        {maybeRenderStatusIcon}
        <Group.Item flexValue={1} paddingTop="xxs">
          <Heading.Small className={headerClassName}>
            {column.canonicalName()}
          </Heading.Small>
        </Group.Item>
        <MenuDropdown
          column={column}
          setMovedCard={setMovedCard}
          setMovedGroupType={setMovedGroupType}
        />
      </Group.Horizontal>
      <Group.Vertical
        className={messageClassName}
        paddingLeft="xl"
        paddingRight="s"
        spacing="xxs"
      >
        <I18N inputName={column.name()}>Input name: %(inputName)s</I18N>
        {renderBody()}
      </Group.Vertical>
    </div>
  );
}
