// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import QueryFilterUtil from 'models/core/wip/QueryFilter/QueryFilterUtil';
import { uniqueId } from 'util/util';
import type { Customizable } from 'types/interfaces/Customizable';
import type { NamedItem } from 'models/ui/HierarchicalSelector/types';
import type {
  QueryFilter,
  SerializedQueryFilter,
} from 'models/core/wip/QueryFilter/types';
import type { Serializable } from 'lib/Zen';

type Values = {
  id: string,
  filter: QueryFilter,
};

type SerializedSimpleQueryFilterItem = {
  id: string,
  filter: SerializedQueryFilter,
};

/**
 * This class is a simple wrapper around a QueryFilter so you can use
 * any type of filter inside of QuerySelections.
 * NOTE(pablo): this is currently not used anywhere, but we are leaving
 * the model here because it is a useful escape hatch for when you need
 * to build complex queries.
 */
class SimpleQueryFilterItem extends Zen.BaseModel<SimpleQueryFilterItem, Values>
  implements
    Serializable<SerializedSimpleQueryFilterItem>,
    Customizable<SimpleQueryFilterItem>,
    NamedItem {
  tag: 'SIMPLE_QUERY_FILTER_ITEM' = 'SIMPLE_QUERY_FILTER_ITEM';
  static createFromFilter(filter: QueryFilter): SimpleQueryFilterItem {
    return this.create({
      id: `${uniqueId()}`,
      filter,
    });
  }

  static deserializeAsync(
    serializedSimpleQueryFilterItem: SerializedSimpleQueryFilterItem,
  ): Promise<Zen.Model<SimpleQueryFilterItem>> {
    return QueryFilterUtil.deserializeAsync(
      serializedSimpleQueryFilterItem.filter,
    ).then(filter =>
      SimpleQueryFilterItem.create({
        id: serializedSimpleQueryFilterItem.id,
        filter,
      }),
    );
  }

  // NOTE(stephen): This is only customizable to make the filter item have
  // similar features to the other filter items.
  customize(): Zen.Model<SimpleQueryFilterItem> {
    return this._;
  }

  // This function is necessary to use this model in our AQT FilterSelector
  // without getting a type error
  name(): string {
    return this._.id();
  }

  serialize(): SerializedSimpleQueryFilterItem {
    return {
      id: this._.id(),
      filter: this._.filter().serialize(),
    };
  }
}

export default ((SimpleQueryFilterItem: $Cast): Class<
  Zen.Model<SimpleQueryFilterItem>,
>);
