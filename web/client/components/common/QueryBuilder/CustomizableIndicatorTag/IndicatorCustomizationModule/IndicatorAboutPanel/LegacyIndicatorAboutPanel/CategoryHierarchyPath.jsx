// @flow
import * as React from 'react';

import Breadcrumb, { BreadcrumbItem } from 'components/ui/Breadcrumb';
import Icon from 'components/ui/Icon';
import type LinkedCategory from 'models/core/wip/LinkedCategory';

type Props = {
  category: LinkedCategory,
};

export default function CategoryHierarchyPath({ category }: Props): React.Node {
  const path = React.useMemo(() => {
    // Collect all the full ancestor hierarchy of a LinkedCategory into a single
    // array. The `pathList` will contain all parents of the category in
    // reverse order: i.e. the order will be [child, parent, grand parent, ...].
    const pathList = [];
    let current = category;
    while (current) {
      pathList.push({ id: current.id(), name: current.name() });
      current = current.parent();
    }

    return pathList.reverse();
  }, [category]);

  return (
    <div className="indicator-customization-module__hierarchy-path">
      <div className="indicator-customization-module__breadcrumb-path">
        <Breadcrumb className="indicator-customization-module__breadcrumb">
          <BreadcrumbItem value="home">
            <Icon type="home" />
          </BreadcrumbItem>
          {path.map(({ id, name }) => (
            <BreadcrumbItem key={id} value={name}>
              {name}
            </BreadcrumbItem>
          ))}
        </Breadcrumb>
      </div>
    </div>
  );
}
