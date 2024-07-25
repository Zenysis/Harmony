// @flow
import * as React from 'react';
import invariant from 'invariant';

import I18N from 'lib/I18N';
import MatchSelector from 'components/DataUploadApp/AddDataModal/MappingPage/Cards/MatchSelector';
import { DataUploadModalDispatch } from 'components/DataUploadApp/AddDataModal/useDataUploadModalContext';
import type ColumnSpec from 'models/DataUploadApp/ColumnSpec';
import type Field from 'models/core/wip/Field';
import type HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import type LinkedCategory from 'models/core/wip/LinkedCategory';

type Props = {
  column: ColumnSpec,
  fieldHierarchyRoot: HierarchyItem<LinkedCategory | Field>,
};

export default function FieldCardBody({
  column,
  fieldHierarchyRoot,
}: Props): React.Node {
  const dispatch = React.useContext(DataUploadModalDispatch);

  const onFieldSelect = React.useCallback(
    item => {
      const field = item.metadata();
      invariant(
        field.tag === 'FIELD',
        'Leaf hierarchy items can only hold Field models',
      );
      dispatch({
        columnName: column.name(),
        columnSpec: column.updateFieldMatch(field),
        type: 'COLUMN_SPEC_CHANGE',
        typeChanged: false,
      });
    },
    [column, dispatch],
  );

  const renderMatchedSection = () => {
    if (column.isNewColumn()) {
      return (
        <div className="u-info-text data-upload-matching-card__new-column">
          <I18N>Marked as a new indicator</I18N>
        </div>
      );
    }

    return (
      <React.Fragment>
        <MatchSelector
          column={column}
          hierarchyRoot={fieldHierarchyRoot}
          onItemSelect={onFieldSelect}
          selectorTitle={I18N.text('Select a data source')}
        />
        {!column.match() && (
          <div className="data-upload-matching-card__message--error data-upload-matching-card__matching-error-msg">
            <I18N>Name not recognized</I18N>
          </div>
        )}
      </React.Fragment>
    );
  };

  return (
    <React.Fragment>
      {renderMatchedSection()}
      {column.datatype() !== 'number' && (
        <div className="data-upload-matching-card__message--error">
          <I18N>Numeric value required</I18N>
        </div>
      )}
    </React.Fragment>
  );
}
