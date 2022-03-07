// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import QueryFilterUtil from 'models/core/wip/QueryFilter/QueryFilterUtil';
import type {
  QueryFilter,
  SerializedQueryFilter,
} from 'models/core/wip/QueryFilter/types';
import type { Serializable } from 'lib/Zen';

type Values = {
  fields: Zen.Array<QueryFilter>,
};

export type SerializedAndFilter = {
  type: 'AND',
  fields: Array<SerializedQueryFilter>,
};

class AndFilter extends Zen.BaseModel<AndFilter, Values>
  implements Serializable<SerializedAndFilter> {
  tag: 'AND' = 'AND';

  static deserializeAsync(
    values: SerializedAndFilter,
  ): Promise<Zen.Model<AndFilter>> {
    const filterPromises = values.fields.map(QueryFilterUtil.deserializeAsync);
    return Promise.all(filterPromises).then(fields =>
      AndFilter.create({ fields: Zen.Array.create(fields) }),
    );
  }

  static UNSAFE_deserialize(values: SerializedAndFilter): Zen.Model<AndFilter> {
    const fields = values.fields.map(QueryFilterUtil.UNSAFE_deserialize);
    return AndFilter.create({ fields: Zen.Array.create(fields) });
  }

  serialize(): SerializedAndFilter {
    return {
      type: this.tag,
      fields: this._.fields().mapValues(filter => filter.serialize()),
    };
  }
}

export default ((AndFilter: $Cast): Class<Zen.Model<AndFilter>>);
