// @flow
import Promise from 'bluebird';
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import DimensionService from 'services/wip/DimensionService';
import DimensionValue from 'models/core/wip/Dimension/DimensionValue';
import NotFilter from 'models/core/wip/QueryFilter/NotFilter';
import OrFilter from 'models/core/wip/QueryFilter/OrFilter';
import memoizeOne from 'decorators/memoizeOne';
import { uniqueId } from 'util/util';
import type Dimension from 'models/core/wip/Dimension';
import type { Customizable } from 'types/interfaces/Customizable';
import type { Displayable } from 'types/interfaces/Displayable';
import type { QueryFilter } from 'models/core/wip/QueryFilter/types';
import type { Serializable } from 'lib/Zen';

type RequiredValues = {
  // HACK(stephen): Right now, DimensionValueFilterItem stores an array of
  // dimension values to filter on. These dimension values all cover the same
  // dimension. This assumption likely will not hold in the future when complex
  // filters are supported.
  dimension: Zen.ReadOnly<Dimension>,
  id: string,
};

type DefaultValues = {
  dimensionValues: Zen.Array<DimensionValue>,
  invert: boolean,
};

type SerializedDimensionValueFilterItem = {
  id: string,
  dimension: Zen.Serialized<Dimension>,
  dimensionValues: $ReadOnlyArray<Zen.Serialized<DimensionValue>>,
  invert: boolean,
};

class DimensionValueFilterItem
  extends Zen.BaseModel<DimensionValueFilterItem, RequiredValues, DefaultValues>
  implements
    Serializable<SerializedDimensionValueFilterItem>,
    Customizable<DimensionValueFilterItem>,
    Displayable {
  static defaultValues = {
    dimensionValues: Zen.Array.create(),
    invert: false,
  };

  static createFromDimensionValues(
    ...dimensionValues: $ReadOnlyArray<DimensionValue>
  ): Zen.Model<DimensionValueFilterItem> {
    const dimensions = Array.from(
      new Set(dimensionValues.map(v => v.dimension())),
    );
    invariant(
      dimensions.length === 1,
      'Unable to deduce single dimension from dimension values received.',
    );

    const dimension = dimensions[0];
    return DimensionValueFilterItem.create({
      dimension,
      id: `${dimension.id()}__${uniqueId()}`,
      dimensionValues: Zen.Array.create(dimensionValues),
    });
  }

  static deserializeAsync(
    values: SerializedDimensionValueFilterItem,
  ): Promise<Zen.Model<DimensionValueFilterItem>> {
    const dimensionURI = values.dimension.$ref;
    return Promise.all([
      DimensionService.get(DimensionService.convertURIToID(dimensionURI)),
      ...values.dimensionValues.map(DimensionValue.deserializeAsync),
    ]).then(([dimension, ...dimensionValues]) =>
      DimensionValueFilterItem.create({
        dimension,
        dimensionValues: Zen.Array.create(dimensionValues),
        id: values.id,
        invert: values.invert,
      }),
    );
  }

  customize(): Zen.Model<DimensionValueFilterItem> {
    return this._.id(`${this._.id()}__${uniqueId()}`);
  }

  displayValue(): string {
    const dimensionValues = this._.dimensionValues();
    const count = dimensionValues.size();

    // TODO(stephen): Translate this.
    const base =
      count === 1 ? dimensionValues.get(0).displayValue() : `${count} selected`;
    if (this._.invert()) {
      // TODO(stephen, pablo): Translate this too.
      return `NOT ${base}`;
    }
    return base;
  }

  _buildFilter(): QueryFilter {
    const values = this._.dimensionValues();

    if (values.size() === 1) {
      return values.get(0).filter();
    }

    return OrFilter.create({
      fields: values.map(d => d.filter()),
    });
  }

  @memoizeOne
  filter(): QueryFilter | void {
    if (this._.dimensionValues().isEmpty()) {
      return undefined;
    }

    const filter = this._buildFilter();
    if (this._.invert()) {
      return NotFilter.create({
        field: filter,
      });
    }
    return filter;
  }

  serialize(): SerializedDimensionValueFilterItem {
    return {
      dimension: this._.dimension().serialize(),
      dimensionValues: Zen.serializeArray(this._.dimensionValues()),
      id: this._.id(),
      invert: this._.invert(),
    };
  }
}

export default ((DimensionValueFilterItem: any): Class<
  Zen.Model<DimensionValueFilterItem>,
>);
