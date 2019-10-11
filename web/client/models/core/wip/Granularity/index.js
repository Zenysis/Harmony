// @flow
import * as Zen from 'lib/Zen';
import GranularityService from 'services/wip/GranularityService';
import LinkedCategory from 'models/core/wip/LinkedCategory';
import type { Customizable } from 'types/interfaces/Customizable';
import type { JSONRef } from 'services/types/api';
import type { Serializable } from 'lib/Zen';

type RequiredValues = {
  id: string,
  name: string,
  category: LinkedCategory,
};

type DefaultValues = {
  description: string,
};

type SerializedGranularity = JSONRef;

/**
 * The Granularity model represents the time granularity a query will be
 * grouped by.
 * TODO(pablo): we need to create a GroupingGranularity wrapper model,
 * similar to how we created a GroupingDimension wrapper for a Dimension.
 * This wrapper will hold the user-editable name for a granularity. Right now
 * there is an AQT dashboard bug where if a user changes the name of a
 * granularity, it will not persist if they refresh the page and re-open the
 * Edit panel.
 */
class Granularity
  extends Zen.BaseModel<Granularity, RequiredValues, DefaultValues>
  implements Serializable<SerializedGranularity>, Customizable<Granularity> {
  static defaultValues = {
    description: '',
  };

  static deserializeAsync(values: SerializedGranularity): Promise<Granularity> {
    return GranularityService.get(
      GranularityService.convertURIToID(values.$ref),
    );
  }

  serialize(): SerializedGranularity {
    return {
      $ref: GranularityService.convertIDToURI(this._.id()),
    };
  }

  serializeForQuery(): SerializedGranularity {
    // NOTE(stephen): Granularity does not currently have any fields that should
    // be stripped out during querying.
    return this.serialize();
  }

  // NOTE(stephen): Currently, a Granularity instance only holds display
  // information and customization does not affect the query.
  // TODO(stephen): Figure out how customization will work.
  customize(): Zen.Model<Granularity> {
    return this._;
  }
}

export default ((Granularity: any): Class<Zen.Model<Granularity>>);
