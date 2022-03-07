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
  field: QueryFilter,
};

export type SerializedNotFilter = {
  type: 'NOT',
  field: SerializedQueryFilter,
};

class NotFilter extends Zen.BaseModel<NotFilter, Values>
  implements Serializable<SerializedNotFilter> {
  tag: 'NOT' = 'NOT';

  static deserializeAsync(
    values: SerializedNotFilter,
  ): Promise<Zen.Model<NotFilter>> {
    return QueryFilterUtil.deserializeAsync(values.field).then(field =>
      NotFilter.create({ field }),
    );
  }

  static UNSAFE_deserialize(values: SerializedNotFilter): Zen.Model<NotFilter> {
    const field = QueryFilterUtil.UNSAFE_deserialize(values.field);
    return NotFilter.create({ field });
  }

  serialize(): SerializedNotFilter {
    return {
      type: this.tag,
      field: this._.field().serialize(),
    };
  }
}

export default ((NotFilter: $Cast): Class<Zen.Model<NotFilter>>);
