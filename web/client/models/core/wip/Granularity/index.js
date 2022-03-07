// @flow
import type Promise from 'bluebird';

import * as Zen from 'lib/Zen';
// no way to avoid this circular dependency unfortunately
// eslint-disable-next-line import/no-cycle
import GranularityService from 'services/wip/GranularityService';
import LinkedCategory from 'models/core/wip/LinkedCategory';
import type { JSONRef } from 'services/types/api';
import type { Serializable } from 'lib/Zen';

type RequiredValues = {
  id: string,
  name: string,
  category: LinkedCategory,
};

type DefaultValues = {
  +description: string,
};

type SerializedGranularity = JSONRef;

/**
 * The Granularity model represents the time granularity a query will be
 * grouped by.
 */
class Granularity
  extends Zen.BaseModel<Granularity, RequiredValues, DefaultValues>
  implements Serializable<SerializedGranularity> {
  tag: 'GRANULARITY' = 'GRANULARITY';

  static defaultValues: DefaultValues = {
    description: '',
  };

  static deserializeAsync(
    values: SerializedGranularity,
  ): Promise<Zen.Model<Granularity>> {
    return GranularityService.forceGet(
      GranularityService.convertURIToID(values.$ref),
    );
  }

  serialize(): SerializedGranularity {
    return {
      $ref: GranularityService.convertIDToURI(this._.id()),
    };
  }
}

export default ((Granularity: $Cast): Class<Zen.Model<Granularity>>);
