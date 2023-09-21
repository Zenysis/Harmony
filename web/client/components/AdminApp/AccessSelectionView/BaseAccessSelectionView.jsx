// @flow
import * as React from 'react';

import BaseModal from 'components/ui/BaseModal';
import Checkbox from 'components/ui/Checkbox';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import Table from 'components/ui/Table';
import type { SortDirection, TableHeader } from 'components/ui/Table';

type Props<T> = {
  checkAllValue: boolean,
  initialColumnSortOrder?: SortDirection,
  initialColumnToSort?: string,
  onCheckAllChange: (isSelected: boolean) => void,
  onPrimaryAction: () => void,
  onRequestClose: () => void,
  renderTableRow: (rowData: T) => React.Element<typeof Table.Row>,
  sectionDescription: string,
  sectionHeading: string,
  showModal: boolean,

  tableData: $ReadOnlyArray<T>,
  tableHeaders: $ReadOnlyArray<TableHeader<T>>,
};

const PAGE_SIZE = 10;

export default function BaseAccessSelectionView<T>({
  checkAllValue,
  onCheckAllChange,
  onPrimaryAction,
  onRequestClose,
  renderTableRow,
  sectionDescription,
  sectionHeading,
  showModal,
  tableData,
  tableHeaders,
  initialColumnSortOrder = 'ASC',
  initialColumnToSort = undefined,
}: Props<T>): React.Element<typeof BaseModal> {
  return (
    <BaseModal
      className="access-selection-view"
      height={984}
      onPrimaryAction={onPrimaryAction}
      onRequestClose={onRequestClose}
      primaryButtonText={I18N.textById('Save')}
      show={showModal}
      width={984}
    >
      <Heading size={Heading.Sizes.LARGE}>{sectionHeading}</Heading>
      <Group.Item className="u-info-text" paddingBottom="s" paddingTop="m">
        {sectionDescription}
      </Group.Item>
      <Group.Vertical>
        <Checkbox
          className="access-selection-view__check-all-rows"
          label={I18N.textById('All')}
          onChange={onCheckAllChange}
          value={checkAllValue}
        />
        <Table
          className="access-selection-view__table"
          data={tableData}
          headers={tableHeaders}
          initialColumnSortOrder={initialColumnSortOrder}
          initialColumnToSort={initialColumnToSort}
          pageSize={PAGE_SIZE}
          renderRow={renderTableRow}
        />
      </Group.Vertical>
    </BaseModal>
  );
}
