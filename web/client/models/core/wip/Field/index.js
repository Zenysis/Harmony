// @flow
import * as Zen from 'lib/Zen';
import CalculationUtil from 'models/core/wip/Calculation/CalculationUtil';
import CustomizableTimeInterval from 'models/core/wip/QueryFilterItem/CustomizableTimeInterval';
import Dataset from 'models/core/wip/Dataset';
import LegacyField from 'models/core/Field';
import LinkedCategory from 'models/core/wip/LinkedCategory';
import QueryFilterItemUtil from 'models/core/wip/QueryFilterItem/QueryFilterItemUtil';
import computeLegacyField from 'models/core/wip/Field/computeLegacyField';
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
  id: string,
  category: Zen.ReadOnly<LinkedCategory>,
  canonicalName: Zen.ReadOnly<string>,

  // A shortened version of the Field's canonical name that can never be empty.
  // It can be used when a short version of the Field name is acceptable to
  // display because more information exists that makes it obvious what the full
  // name is.
  shortName: Zen.ReadOnly<string>,
  source: Zen.ReadOnly<Dataset>,

  /**
   * Defines how this field should be calculated. This Calculation can be any
   * of the allowable calculations: AverageCalculation, SumCalculation, etc.
   */
  calculation: Calculation,
};

type DefaultValues = {
  // TODO(pablo): eventually this should be stored as part of the Calculation,
  // not in the Field
  customizableFilterItems: Zen.Array<QueryFilterItem>,
  description: string,
  userDefinedLabel: string,
};

type DerivedValues = {
  // This is the display label to show to the user when a shortened version
  // of the indicator name is acceptable. It should never be empty.
  label: string,
  legacyField: LegacyField,
  name: string,
};

type SerializedField = {
  calculation: SerializedCalculation,
  category: Zen.Serialized<LinkedCategory>,
  canonicalName: string,
  id: string,
  shortName: string,
  source: Zen.Serialized<Dataset>,

  customizableFilterItems: Array<SerializedQueryFilterItem>,
  description?: string,
  label?: string,
};

export type SerializedFieldForQuery = {
  calculation: SerializedCalculation,
  id: string,
};

class Field
  extends Zen.BaseModel<Field, RequiredValues, DefaultValues, DerivedValues>
  implements Serializable<SerializedField>, Customizable<Field> {
  static defaultValues = {
    customizableFilterItems: Zen.Array.create(),
    description: '',
    userDefinedLabel: '',
  };

  static derivedConfig = {
    label: [
      Zen.hasChanged<Field>('shortName', 'userDefinedLabel'),
      (field: Zen.Model<Field>) =>
        field.userDefinedLabel() || field.shortName(),
    ],
    legacyField: [
      Zen.hasChanged<Field>('userDefinedLabel', 'id'),
      computeLegacyField,
    ],
    name: [
      Zen.hasChanged<Field>('canonicalName'),
      (field: Zen.Model<Field>) => field.canonicalName(),
    ],
  };

  static deserializeAsync(values: SerializedField): Promise<Zen.Model<Field>> {
    const {
      id,
      canonicalName,
      shortName,
      calculation,
      customizableFilterItems,
    } = values;
    return Promise.all([
      CalculationUtil.deserializeAsync(calculation),
      LinkedCategory.deserializeAsync(values.category),
      Dataset.deserializeAsync(values.source),
      Promise.all(
        customizableFilterItems.map(filterItem =>
          QueryFilterItemUtil.deserializeAsync(filterItem),
        ),
      ),
    ]).then(([fullCalculation, category, source, deserializedFilterItems]) =>
      Field.create({
        id,
        category,
        canonicalName,
        shortName,
        source,
        calculation: fullCalculation,
        customizableFilterItems: Zen.Array.create(deserializedFilterItems),
      }),
    );
  }

  static UNSAFE_deserialize(values: SerializedField): Zen.Model<Field> {
    const { id, canonicalName, shortName } = values;
    const category = LinkedCategory.UNSAFE_deserialize(values.category);
    const source = Dataset.UNSAFE_deserialize(values.source);
    const calculation = CalculationUtil.UNSAFE_deserialize(values.calculation);
    return this.create({
      id,
      category,
      canonicalName,
      shortName,
      source,
      calculation,
    });
  }

  customize(): Zen.Model<Field> {
    return this._.id(`${this._.id()}__${uniqueId()}`);
  }

  getOriginalId(): string {
    // HACK(david): Data Quality Lab requires non-customized id. Adding this to
    // get that value until we come up with a better solution.
    return this._.id().split('__')[0];
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

  serialize(): SerializedField {
    const {
      calculation,
      category,
      canonicalName,
      id,
      shortName,
      source,
      description,
      label,
      customizableFilterItems,
    } = this.modelValues();

    // HACK(stephen): Giant hack because of how Field is saved to a dashboard.
    // The category/source IDs are not stable at this time.
    // TODO(stephen, pablo): Fix this dependency. I don't think dashboards need
    // this metadata anyways.
    const serializedCategory = category
      ? category.serialize()
      : { $ref: 'xxx' };
    const serializedSource = source ? source.serialize() : { $ref: 'xxx' };
    return {
      canonicalName,
      id,
      shortName,
      description,
      label,
      calculation: calculation.serialize(),
      category: serializedCategory,
      source: serializedSource,
      customizableFilterItems: customizableFilterItems.mapValues(filterItem =>
        QueryFilterItemUtil.serialize(filterItem),
      ),
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
}

export default ((Field: any): Class<Zen.Model<Field>>);
