// @flow
import * as React from 'react';

import Heading from 'components/ui/Heading';
import Tooltip from 'components/ui/Tooltip';

type Props = {
  categoryId: string,
  categoryName: string,
  onCurrentCategoryChange: (id: string) => void,
};

// Directory table bread crumb item.
export default function BreadcrumbItem({
  categoryId,
  categoryName,
  onCurrentCategoryChange,
}: Props): React.Element<typeof Tooltip> {
  const onItemClick = () => {
    onCurrentCategoryChange(categoryId);
    analytics.track('Click on breadcrumb items to navigate to parent groups');
  };

  return (
    <Tooltip
      content={categoryName}
      delayTooltip={500}
      targetClassName="dc-breadcrumb-item"
    >
      <div onClick={onItemClick} role="button">
        <Heading.Large className="dc-breadcrumb-item__text">
          {categoryName}
        </Heading.Large>
      </div>
    </Tooltip>
  );
}
