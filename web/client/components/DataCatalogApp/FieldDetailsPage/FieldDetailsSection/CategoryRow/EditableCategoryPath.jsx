// @flow
import * as React from 'react';

import CategoryFilterSelector from 'components/DataCatalogApp/common/CategoryFilterSelector';
import CategoryPath from 'components/DataCatalogApp/common/CategoryPath';
import type HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import type { NamedItem } from 'models/ui/HierarchicalSelector/types';

type Props = {
  categoryId: string | void,
  editing: boolean,
  hierarchyRoot: HierarchyItem<NamedItem>,
  onCategoryChange: (id: string, name: string) => void,

  buttonTitle?: string | void,
};

const TEXT = {
  applyButtonText: 'Apply',
};

function EditableCategoryPath({
  categoryId,
  editing,
  hierarchyRoot,
  onCategoryChange,
  buttonTitle = undefined,
}: Props) {
  const onApplyButtonClick = React.useCallback(
    item => onCategoryChange(item.id(), item.name()),
    [onCategoryChange],
  );

  return (
    <div className="editable-category-path">
      {!editing && <CategoryPath id={categoryId} />}
      {editing && (
        <CategoryFilterSelector
          allowRootSelection={false}
          applyButtonText={TEXT.applyButtonText}
          buttonSize="small"
          buttonTitle={buttonTitle}
          enableSearch
          hierarchyRoot={hierarchyRoot}
          maxHeight={400}
          onApplyButtonClick={onApplyButtonClick}
        />
      )}
    </div>
  );
}

export default (React.memo<Props>(
  EditableCategoryPath,
): React.AbstractComponent<Props>);
