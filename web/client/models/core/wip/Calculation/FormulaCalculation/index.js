// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
// eslint-disable-next-line import/no-cycle
import Constituent from 'models/core/wip/Calculation/FormulaCalculation/Constituent';
import FormulaMetadata, {
  strToValidIdentifier,
} from 'models/core/Field/CustomField/Formula/FormulaMetadata';
import QueryFilterUtil from 'models/core/wip/QueryFilter/QueryFilterUtil';
import { databaseIdToRelayId } from 'util/graphql';
import type {
  QueryFilter,
  SerializedQueryFilter,
} from 'models/core/wip/QueryFilter/types';
import type { Serializable } from 'lib/Zen';
import type { SerializedConstituentForQuery } from 'models/core/wip/Calculation/FormulaCalculation/Constituent';

type DefaultValues = {
  constituents: $ReadOnlyArray<Constituent>,
  expression: string,
  filter: QueryFilter | null,
};

type SerializedFormulaCalculation = {
  constituents: $ReadOnlyArray<Zen.Serialized<Constituent>>,
  expression: string,
  filter: SerializedQueryFilter | { type?: void, ... } | null,
  type: 'FORMULA',
};

export type SerializedFormulaCalculationForQuery = {
  constituents: $ReadOnlyArray<SerializedConstituentForQuery>,
  expression: string,
  filter: SerializedQueryFilter | { type?: void, ... } | null,
  type: 'FORMULA',
};

/**
 * Calculate the result of the mathematical formula expression provided using
 * the constituent calculations supplied.
 *
 * NOTE(stephen): Each constituent calculation is supplied directly to the
 * FormulaCalculation, and no lookups are needed. This is the first attempt at
 * migrating calculated indicators into a directly AQT-queryable state.
 */
class FormulaCalculation
  extends Zen.BaseModel<FormulaCalculation, {}, DefaultValues>
  implements Serializable<SerializedFormulaCalculation> {
  tag: 'FORMULA' = 'FORMULA';

  static defaultValues: DefaultValues = {
    constituents: [],
    expression: '',
    filter: null,
  };

  static deserializeAsync(
    values: SerializedFormulaCalculation,
  ): Promise<Zen.Model<FormulaCalculation>> {
    let filterPromise: Promise<QueryFilter | null> = Promise.resolve(null);
    if (values.filter !== null && values.filter.type !== undefined) {
      filterPromise = QueryFilterUtil.deserializeAsync(values.filter);
    }

    return Promise.all([
      filterPromise,
      Promise.all(
        values.constituents.map(c => Constituent.deserializeAsync(c)),
      ),
    ]).then(([filter, constituents]) =>
      FormulaCalculation.create({
        constituents,
        filter,
        expression: values.expression,
      }),
    );
  }

  static UNSAFE_deserialize(
    values: SerializedFormulaCalculation,
  ): Zen.Model<FormulaCalculation> {
    return FormulaCalculation.create({
      constituents: values.constituents.map(Constituent.UNSAFE_deserialize),
      expression: values.expression,
      filter:
        values.filter !== null && values.filter.type !== undefined
          ? QueryFilterUtil.UNSAFE_deserialize(values.filter)
          : null,
    });
  }

  serialize(): SerializedFormulaCalculation {
    const filter = this._.filter();
    return {
      constituents: this._.constituents().map(c => c.serialize()),
      expression: this._.expression(),
      filter: filter ? filter.serialize() : {},
      type: this.tag,
    };
  }

  serializeForQuery(): SerializedFormulaCalculationForQuery {
    const filter = this._.filter();
    return {
      constituents: this._.constituents().map(c => c.serializeForQuery()),
      expression: this._.expression(),
      filter: filter ? filter.serialize() : {},
      type: this.tag,
    };
  }

  // Create a formula metadata object from a formula calculation. This is used
  // by data catalog for loading a FormulaCalculation into the IndicatorFormulaModal.
  createFormulaMetadata(): FormulaMetadata {
    const relayIdFields = [];
    const dbIdFields = [];
    this._.constituents().forEach(constituent => {
      const id = constituent.id();
      const metadata = {
        getLabel: () => constituent.name(),
        jsIdentifier: () => strToValidIdentifier(id),
      };
      relayIdFields.push({
        id: () => databaseIdToRelayId(id, 'field'),
        ...metadata,
      });
      dbIdFields.push({
        id: () => id,
        ...metadata,
      });
    });
    return FormulaMetadata.deserialize(
      { formula: this._.expression() },
      {
        fields: relayIdFields,
        matchFields: dbIdFields,

        // NOTE(pablo): FormulaCalculations for indicators do not support
        // depending on dimensions, so passing an empty array here.
        dimensions: [],
      },
    );
  }
}

export default ((FormulaCalculation: $Cast): Class<
  Zen.Model<FormulaCalculation>,
>);
