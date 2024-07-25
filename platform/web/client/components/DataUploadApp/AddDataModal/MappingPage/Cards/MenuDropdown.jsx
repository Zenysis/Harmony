// @flow
import * as React from 'react';
import Promise from 'bluebird';

import Dropdown from 'components/ui/Dropdown';
import I18N from 'lib/I18N';
import { COLUMN_TYPE } from 'models/DataUploadApp/registry';
import { DataUploadModalDispatch } from 'components/DataUploadApp/AddDataModal/useDataUploadModalContext';
import type ColumnSpec from 'models/DataUploadApp/ColumnSpec';
import type { ColumnType } from 'models/DataUploadApp/types';

type Props = {
  column: ColumnSpec,
  setMovedCard: (string | void) => void,
  setMovedGroupType: (ColumnType | void) => void,
};

export default function MenuDropdown({
  column,
  setMovedCard,
  setMovedGroupType,
}: Props): React.Node {
  const dispatch = React.useContext(DataUploadModalDispatch);

  const { columnType, ignoreColumn, isNewColumn } = column.modelValues();
  const menuOptions = ignoreColumn
    ? [
        <Dropdown.Option key="enable" value="enable">
          {I18N.text('Enable column')}
        </Dropdown.Option>,
      ]
    : [
        columnType === COLUMN_TYPE.DIMENSION ? null : (
          <Dropdown.Option key="moveToDimension" value="moveToDimension">
            {I18N.text('Move to Group Bys')}
          </Dropdown.Option>
        ),
        columnType === COLUMN_TYPE.DATE ? null : (
          <Dropdown.Option key="moveToDate" value="moveToDate">
            {I18N.text('Move to Date')}
          </Dropdown.Option>
        ),
        columnType === COLUMN_TYPE.FIELD ? null : (
          <Dropdown.Option key="moveToField" value="moveToField">
            {I18N.text('Move to Indicators')}
          </Dropdown.Option>
        ),
        columnType === COLUMN_TYPE.FIELD && !isNewColumn ? (
          <Dropdown.Option key="markAsNew" value="markAsNew">
            {I18N.text('Mark as new indicator')}
          </Dropdown.Option>
        ) : null,
        columnType === COLUMN_TYPE.FIELD && isNewColumn ? (
          <Dropdown.Option key="removeAsNew" value="removeAsNew">
            {I18N.text('Remove as new indicator')}
          </Dropdown.Option>
        ) : null,
        <Dropdown.Option key="ignore" value="ignore">
          {I18N.text('Drop column')}
        </Dropdown.Option>,
      ];

  const getNewColumnSpec = (
    optionValue: string,
  ): Promise<{ columnSpec: ColumnSpec, movedGroupType?: ColumnType }> => {
    switch (optionValue) {
      case 'enable':
        return Promise.resolve({
          columnSpec: column.ignoreColumn(false),
        });
      case 'ignore':
        return Promise.resolve({
          columnSpec: column.ignoreColumn(true),
        });
      case 'moveToDate':
        return Promise.resolve({
          columnSpec: column.toDateType(),
          movedGroupType: COLUMN_TYPE.DATE,
        });
      case 'moveToDimension':
        return column.toDimensionType().then(newColumnSpec => {
          return {
            columnSpec: newColumnSpec,
            movedGroupType: COLUMN_TYPE.DIMENSION,
          };
        });
      case 'moveToField':
        return Promise.resolve({
          columnSpec: column.toFieldType(),
          movedGroupType: COLUMN_TYPE.FIELD,
        });
      case 'markAsNew':
        return Promise.resolve({
          columnSpec: column.modelValues({
            canonicalName: column.name(),
            isNewColumn: true,
            match: undefined,
          }),
        });
      case 'removeAsNew':
        return Promise.resolve({
          columnSpec: column.modelValues({
            isNewColumn: false,
            match: undefined,
          }),
        });
      default:
        throw new Error(`Invalid column action: ${optionValue}`);
    }
  };

  const changeColumnSpec = (optionValue: string) => {
    getNewColumnSpec(optionValue).then(({ columnSpec, movedGroupType }) => {
      const typeChanged = !!movedGroupType;
      dispatch({
        columnSpec,
        typeChanged,
        columnName: column.name(),
        type: 'COLUMN_SPEC_CHANGE',
      });
      if (typeChanged) {
        setMovedCard(column.name());
        setMovedGroupType(movedGroupType);
      } else {
        setMovedCard(undefined);
        setMovedGroupType(undefined);
      }
    });
  };

  return (
    <Dropdown
      ariaName={I18N.text('Take action on card')}
      buttonClassName="data-upload-matching-card__dropdown-button"
      onSelectionChange={changeColumnSpec}
      value={undefined}
      // NOTE: This controls the style of the label for the dropdown button. We do not
      // want a label and the simplest way to get the alignment correct is to not display it.
      valueStyle={{ display: 'none' }}
    >
      {menuOptions}
    </Dropdown>
  );
}
