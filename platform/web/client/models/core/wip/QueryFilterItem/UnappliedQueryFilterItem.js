// @flow
import * as Zen from 'lib/Zen';
import type CustomizableTimeInterval from 'models/core/wip/QueryFilterItem/CustomizableTimeInterval';
import type DimensionValueFilterItem from 'models/core/wip/QueryFilterItem/DimensionValueFilterItem';
import type { Customizable } from 'types/interfaces/Customizable';
import type { NamedItem } from 'models/ui/HierarchicalSelector/types';

type Values = {
  item: CustomizableTimeInterval | DimensionValueFilterItem,
};

type DerivedValues = {
  id: string,
};

/**
 * This class is a simple wrapper around a QueryFilterItem so that changes can
 * be made to a concrete QueryFilterItem without the value being applied by a
 * query.
 *
 * This class deviates from other QueryFilterItem types since it has a very
 * specific use case: to enable "uncontrolled" filter building with the
 * `CustomizableFilterTag` while also populating a space in a filter list (like
 * in `FilterSelectionBlock`). It is not serializable - it should never be
 * persisted, since it should only exists temporarily.
 */
class UnappliedQueryFilterItem
  extends Zen.BaseModel<UnappliedQueryFilterItem, Values, {}, DerivedValues>
  implements Customizable<UnappliedQueryFilterItem>, NamedItem {
  tag: 'UNAPPLIED_QUERY_FILTER_ITEM' = 'UNAPPLIED_QUERY_FILTER_ITEM';

  static derivedConfig: Zen.DerivedConfig<
    UnappliedQueryFilterItem,
    DerivedValues,
  > = {
    id: [
      Zen.hasChangedDeep('item.id'),
      queryFilterItem => `unapplied_${queryFilterItem.item().get('id')}`,
    ],
  };

  customize(): Zen.Model<UnappliedQueryFilterItem> {
    return this._.item(this._.item().customize());
  }

  // This function is necessary to use this model in our AQT FilterSelector
  // without getting a type error.
  name(): string {
    throw new Error('[UnappliedQueryFilterItem] Name usage not supported');
  }
}

export default ((UnappliedQueryFilterItem: $Cast): Class<
  Zen.Model<UnappliedQueryFilterItem>,
>);
