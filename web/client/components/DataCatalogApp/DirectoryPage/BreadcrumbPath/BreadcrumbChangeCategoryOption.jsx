// @flow
import * as React from 'react';

import ChangeCategorySelector from 'components/DataCatalogApp/common/ChangeCategorySelector';
import I18N from 'lib/I18N';
import Toaster from 'components/ui/Toaster';
import useParentCategoryChangeForCategoryMutation from 'components/DataCatalogApp/DirectoryPage/hooks/ParentCategoryChange/useParentCategoryChangeForCategoryMutation';

type Props = {
  categoryId: string,
  categoryName: string,
  hierarchyRoot: $PropertyType<
    React.ElementConfig<typeof ChangeCategorySelector>,
    'hierarchyRoot',
  >,
  onSelectorClose: () => void,
  parentCategoryId: string,
};

// Wrapper for breadcrumb menu change category option.
export default function BreadcrumbChangeCategoryOption({
  categoryId,
  categoryName,
  hierarchyRoot,
  onSelectorClose,
  parentCategoryId,
}: Props): React.Element<typeof ChangeCategorySelector> {
  const commitParentCategoryChange = useParentCategoryChangeForCategoryMutation();

  const onCategoryChange = React.useCallback(
    (newParentCategoryId: string, newParentCategoryName: string) => {
      commitParentCategoryChange({
        variables: {
          categoryId,
          newParentCategoryId,
          originalParentCategoryId: parentCategoryId,
        },
        onCompleted: () => {
          Toaster.success(
            I18N.text(
              '%(categoryName)s has been moved to %(newParentCategoryName)s',
              { categoryName, newParentCategoryName },
            ),
          );
          analytics.track('Move item in directory', {
            type: 'group',
            location: 'breadcrumb',
            multiselect: false,
          });
        },
        onError: error => Toaster.error(error.message),
      });
      onSelectorClose();
    },
    [
      categoryId,
      categoryName,
      commitParentCategoryChange,
      onSelectorClose,
      parentCategoryId,
    ],
  );

  return (
    <ChangeCategorySelector
      applyButtonText={I18N.text('Move to folder', 'moveToFolder')}
      hierarchyRoot={hierarchyRoot}
      id={categoryId}
      onCategoryChange={onCategoryChange}
    />
  );
}
