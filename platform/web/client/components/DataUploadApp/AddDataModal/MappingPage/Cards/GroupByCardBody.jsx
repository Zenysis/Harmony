// @flow
import * as React from 'react';
import invariant from 'invariant';

import I18N from 'lib/I18N';
import MatchSelector from 'components/DataUploadApp/AddDataModal/MappingPage/Cards/MatchSelector';
import { DataUploadModalDispatch } from 'components/DataUploadApp/AddDataModal/useDataUploadModalContext';
import type ColumnSpec from 'models/DataUploadApp/ColumnSpec';
import type Dimension from 'models/core/wip/Dimension';
import type HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import type LinkedCategory from 'models/core/wip/LinkedCategory';

type Props = {
  column: ColumnSpec,
  dimensionHierarchyRoot: HierarchyItem<LinkedCategory | Dimension>,
};

export default function GroupByCardBody({
  column,
  dimensionHierarchyRoot,
}: Props): React.Node {
  const dispatch = React.useContext(DataUploadModalDispatch);
  const onItemSelect = React.useCallback(
    item => {
      const dimension = item.metadata();
      invariant(
        dimension.tag === 'DIMENSION',
        'Leaf hierarchy items can only hold Dimension models',
      );
      dispatch({
        columnName: column.name(),
        columnSpec: column.updateDimensionMatch(dimension.id()),
        type: 'COLUMN_SPEC_CHANGE',
        typeChanged: false,
      });
    },
    [column, dispatch],
  );

  return (
    <React.Fragment>
      <MatchSelector
        column={column}
        hierarchyRoot={dimensionHierarchyRoot}
        onItemSelect={onItemSelect}
        selectorTitle={I18N.text('Select a category')}
      />
      {column.error() && (
        <div className="data-upload-matching-card__message--error data-upload-matching-card__matching-error-msg">
          <I18N>Group bys require a match</I18N>
        </div>
      )}
    </React.Fragment>
  );
}
