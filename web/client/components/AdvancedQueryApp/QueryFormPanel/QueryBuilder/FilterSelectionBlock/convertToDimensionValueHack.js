// @flow
import * as Zen from 'lib/Zen';
import DimensionValueFilterItem from 'models/core/wip/QueryFilterItem/DimensionValueFilterItem';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import { uniqueId } from 'util/util';
import type CustomizableTimeInterval from 'models/core/wip/QueryFilterItem/CustomizableTimeInterval';
import type Dimension from 'models/core/wip/Dimension';

// HACK(stephen): The items stored in the hierarchy tree are Dimensions,
// not DimensionValues. This is because the user selects the Dimension
// they want to apply a DimensionValue filter on top of. When a Dimension
// is selected, use the first dimension value from the dimensionValueMap
// as the default value selected instead of the Dimension item which is
// useless.
export default function convertToDimensionValueHack(
  selectedItem: HierarchyItem<Dimension | CustomizableTimeInterval>,
): HierarchyItem<DimensionValueFilterItem | CustomizableTimeInterval> {
  const metadata = selectedItem.metadata();
  if (metadata.tag === 'DIMENSION') {
    const dimensionItem = Zen.cast<HierarchyItem<Dimension>>(selectedItem);
    return HierarchyItem.create({
      metadata: DimensionValueFilterItem.create({
        dimension: metadata.id(),
        id: `${metadata.id()}__${uniqueId()}`,
      }),
      id: dimensionItem.id(),
      children: undefined,
    });
  }
  return Zen.cast<HierarchyItem<CustomizableTimeInterval>>(selectedItem);
}
