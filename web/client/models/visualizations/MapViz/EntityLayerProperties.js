// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

type DefaultValues = {
  /** User selections */
  entitySelections: { +[EntityType: string]: $ReadOnlyArray<string> },
  /** The category used to filter on. Undefined if there are no categories */
  selectedEntityType: string | void,
  showEPICenters: boolean,
  showGroceries: boolean,
  showPharmacies: boolean,
  showSafeSpaces: boolean,
};

type SerializedEntityLayerProperties = {
  entitySelections: { +[EntityType: string]: $ReadOnlyArray<string> },
  selectedEntityType: string | void,
  showEPICenters: boolean,
  showGroceries: boolean,
  showPharmacies: boolean,
  showSafeSpaces: boolean,
};

/** This ZenModel stores information needed to render the filtered selections
 * on the Map's Entity Layer. In the future, we can use this as a jumping off
 * point for how to create common properties for more complex Map layers */
class EntityLayerProperties
  extends Zen.BaseModel<EntityLayerProperties, {}, DefaultValues>
  implements Serializable<SerializedEntityLayerProperties> {
  static defaultValues: DefaultValues = {
    entitySelections: {},
    selectedEntityType: undefined,
    showEPICenters: false,
    showGroceries: false,
    showPharmacies: false,
    showSafeSpaces: false,
  };

  static deserialize(
    values: SerializedEntityLayerProperties,
  ): Zen.Model<EntityLayerProperties> {
    return EntityLayerProperties.create({ ...values });
  }

  serialize(): SerializedEntityLayerProperties {
    return {
      selectedEntityType: this._.selectedEntityType(),
      entitySelections: this._.entitySelections(),
      showEPICenters: this._.showEPICenters(),
      showGroceries: this._.showGroceries(),
      showPharmacies: this._.showPharmacies(),
      showSafeSpaces: this._.showSafeSpaces(),
    };
  }
}

export default ((EntityLayerProperties: $Cast): Class<
  Zen.Model<EntityLayerProperties>,
>);
