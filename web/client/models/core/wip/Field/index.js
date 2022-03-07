// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import CalculationUtil from 'models/core/wip/Calculation/CalculationUtil';
import CustomizableTimeInterval from 'models/core/wip/QueryFilterItem/CustomizableTimeInterval';
import QueryFilterItemUtil from 'models/core/wip/QueryFilterItem/QueryFilterItemUtil';
import { uniqueId } from 'util/util';
import type {
  Calculation,
  SerializedCalculation,
} from 'models/core/wip/Calculation/types';
import type { Customizable } from 'types/interfaces/Customizable';
import type {
  QueryFilterItem,
  SerializedQueryFilterItem,
} from 'models/core/wip/QueryFilterItem/types';
import type { Serializable } from 'lib/Zen';

type RequiredValues = {
  /**
   * Defines how this field should be calculated. This Calculation can be any
   * of the allowable calculations: AverageCalculation, SumCalculation, etc.
   */
  calculation: Calculation,

  canonicalName: string,
  id: string,

  // A shortened version of the Field's canonical name that can never be empty.
  // It can be used when a short version of the Field name is acceptable to
  // display because more information exists that makes it obvious what the full
  // name is.
  shortName: string,
};

type DefaultValues = {
  // TODO(pablo): eventually this should be stored as part of the Calculation,
  // not in the Field
  +customizableFilterItems: Zen.Array<QueryFilterItem>,
  +showNullAsZero: boolean,
  +userDefinedLabel: string,
};

type DerivedValues = {
  // This is the display label to show to the user the canonical name
  // or the user customized version of the name. It should never be empty.
  label: string,
  name: string,
  originalId: string,
};

type SerializedField = {
  calculation: SerializedCalculation,
  canonicalName: string,
  customizableFilterItems?: $ReadOnlyArray<SerializedQueryFilterItem>,
  id: string,
  shortName: string,
  showNullAsZero?: boolean,
  userDefinedLabel?: string,
};

export type SerializedFieldForQuery = {
  calculation: SerializedCalculation,
  id: string,
};

/* eslint-enable no-use-before-define */
export function getOriginalId(id: string): string {
  // HACK(david): Data Quality Lab requires non-customized id. Adding this to
  // get that value until we come up with a better solution.
  return id.split('__')[0];
}

class Field
  extends Zen.BaseModel<Field, RequiredValues, DefaultValues, DerivedValues>
  implements Serializable<SerializedField>, Customizable<Field> {
  tag: 'FIELD' = 'FIELD';

  static defaultValues: DefaultValues = {
    customizableFilterItems: Zen.Array.create(),
    showNullAsZero: false,
    userDefinedLabel: '',
  };

  static derivedConfig: Zen.DerivedConfig<Field, DerivedValues> = {
    label: [
      Zen.hasChanged('canonicalName', 'userDefinedLabel'),
      (field: Zen.Model<Field>) =>
        field.userDefinedLabel() || field.canonicalName(),
    ],
    name: [
      Zen.hasChanged('canonicalName'),
      (field: Zen.Model<Field>) => field.canonicalName(),
    ],
    originalId: [
      Zen.hasChanged('id'),
      (field: Zen.Model<Field>) => getOriginalId(field.id()),
    ],
  };

  static deserializeAsync(values: SerializedField): Promise<Zen.Model<Field>> {
    const {
      calculation,
      canonicalName,
      customizableFilterItems = [],
      id,
      showNullAsZero,
      shortName,
      userDefinedLabel,
    } = values;

    return Promise.all([
      CalculationUtil.deserializeAsync(calculation),
      Promise.all(
        customizableFilterItems.map(filterItem =>
          QueryFilterItemUtil.deserializeAsync(filterItem),
        ),
      ),
    ]).then(([fullCalculation, deserializedFilterItems]) =>
      Field.create({
        calculation: fullCalculation,
        canonicalName,
        customizableFilterItems: Zen.Array.create(deserializedFilterItems),
        id,
        shortName,
        showNullAsZero,
        userDefinedLabel,
      }),
    );
  }

  static strToValidIdentifier(str: string): string {
    // Convert a string to a valid JS identifiers that can be plugged into a
    // formula. Replace all invalid characters with underscores.
    return str.replace(/\W/g, '_');
  }

  static UNSAFE_deserialize(values: SerializedField): Zen.Model<Field> {
    const {
      canonicalName,
      id,
      shortName,
      showNullAsZero,
      userDefinedLabel,
    } = values;

    const calculation = CalculationUtil.UNSAFE_deserialize(values.calculation);
    let customizableFilterItems;
    if (values.customizableFilterItems !== undefined) {
      customizableFilterItems = Zen.Array.create(
        values.customizableFilterItems.map(
          QueryFilterItemUtil.UNSAFE_deserialize,
        ),
      );
    }
    return this.create({
      calculation,
      canonicalName,
      customizableFilterItems,
      id,
      shortName,
      showNullAsZero,
      userDefinedLabel,
    });
  }

  customize(): Zen.Model<Field> {
    return this._.id(`${this._.id()}__${uniqueId()}`);
  }

  addFilterItem(
    customizableFilter: CustomizableTimeInterval,
  ): Zen.Model<Field> {
    if (!this._.customizableFilterItems().isEmpty()) {
      // TODO(pablo): remove this once we support more filter items
      throw new Error('Field only supports a single date filter.');
    }

    return this.deepUpdate()
      .customizableFilterItems()
      .push(customizableFilter);
  }

  clearFilterItems(): Zen.Model<Field> {
    const filterItems = this._.customizableFilterItems();
    return this._.customizableFilterItems(filterItems.clear());
  }

  getJSIdentifier(): string {
    return Field.strToValidIdentifier(this._.id());
  }

  serialize(): SerializedField {
    return {
      calculation: this._.calculation().serialize(),
      canonicalName: this._.canonicalName(),
      customizableFilterItems: QueryFilterItemUtil.serializeAppliedItems(
        this._.customizableFilterItems().arrayView(),
      ),
      id: this._.id(),
      shortName: this._.shortName(),
      showNullAsZero: this._.showNullAsZero(),
      userDefinedLabel: this._.userDefinedLabel(),
    };
  }

  serializeForQuery(): SerializedFieldForQuery {
    const calculation = this._.calculation();
    return {
      calculation: CalculationUtil.serializeForQuery(
        calculation,
        this._.customizableFilterItems(),
      ),
      id: this._.id(),
    };
  }

  /**
   * Determine if this Field will produce the same Query representation as
   * the other Field passed in.
   */
  isFieldQueryEqual(otherField: Zen.Model<Field>): boolean {
    return (
      this._ === otherField ||
      (this._.id() === otherField.id() &&
        this._.calculation() === otherField.calculation() &&
        this._.customizableFilterItems() ===
          otherField.customizableFilterItems())
    );
  }
}

export default ((Field: $Cast): Class<Zen.Model<Field>>);
