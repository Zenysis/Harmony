// @flow
import ZenArray from 'util/ZenModel/ZenArray';
import ZenMap from 'util/ZenModel/ZenMap';
import type { AnyModel } from 'lib/Zen/ZenModel';

export interface Serializable<
  SerializedValue,
  DeserializationConfig = any, // eslint-disable-line no-unused-vars
> {
  /**
   * Convert this instance into its SerializedValue
   * @returns {SerializedValue}
   */
  serialize(): SerializedValue;
}

type AnySerializable = Serializable<any, any>;

export type Serialized<T: AnySerializable> = $Call<
  <SV>(Serializable<SV, any>) => SV,
  T,
>;

export type DeserializationConfig<T: AnySerializable> = $Call<
  <DC>(Serializable<any, DC>) => DC,
  T,
>;

export type DeserializableClass<M> = Class<M> & {
  +deserialize: (
    values: Serialized<M>,
    extraConfig: DeserializationConfig<M>,
  ) => M,
};

export type DeserializableModel<M: AnyModel> = DeserializableClass<M>;

/**
 * Convert an array or ZenArray to an array of serialized values.
 */
export function serializeArray<M: AnySerializable>(
  models: $ReadOnlyArray<M> | ZenArray<M>,
): Array<Serialized<M>> {
  if (models instanceof ZenArray) {
    return models.mapValues(m => m.serialize());
  }
  return models.map(m => m.serialize());
}

/**
 * Convert a map or ZenMap to a map of serialized values.
 */
/* ::
declare function serializeMap<M: AnySerializable>(models: ZenMap<M>): {
  [string]: Serialized<M>,
};
declare function serializeMap<T, M: AnySerializable>(models: { +[T]: M }): {
  [T]: Serialized<M>,
};
*/
export function serializeMap<T, M: AnySerializable>(
  models: { +[T]: M } | ZenMap<M>,
): { [T]: Serialized<M> } {
  const result = {};
  if (models instanceof ZenMap) {
    models.forEach((model, key) => {
      result[key] = model.serialize();
    });
  } else {
    Object.keys(models).forEach(key => {
      result[key] = models[key].serialize();
    });
  }
  return result;
}

/**
 * Convert a serialized representation of this model to an instantiated model.
 * This will throw a runtime error unless it's overridden.
 * Sometimes deserialization requires extra values to be passed to fully
 * deserialize the model. These can be passed as the `extraConfig` parameter.
 * @param {SerializedModel} values The serialized representation of this model
 * @param {DeserializationConfig} extraConfig Extra values for deserialization
 */
export function deserialize<M: AnyModel & AnySerializable>(
  ModelClass: DeserializableModel<M>,
  values: Serialized<M>,
  extraConfig: DeserializationConfig<M>,
): M {
  return ModelClass.deserialize(values, extraConfig);
}

/**
 * Deserialize an array of objects by calling `deserialize` on each one.
 * You can also pass an `extraConfig` to be passed to each `deserialize`
 * call. If you need a different extraConfig per model, you can use a function
 * instead that will take the model's index and return a config object.
 * @param {Array<SerializedModel>} modelObjects Array of serialized objects
 * @param {DeserializationConfig | (idx) => DeserializationConfig} extraConfig
 *   An object, or function, with extra information used in deserialization.
 * @returns {Array<Self>}
 */
export function deserializeArray<M: AnyModel & AnySerializable>(
  ModelClass: DeserializableModel<M>,
  modelObjects: $ReadOnlyArray<Serialized<M>>,
  extraConfig: DeserializationConfig<M> | (number => DeserializationConfig<M>),
): Array<M> {
  return modelObjects.map((obj, i) =>
    extraConfig && typeof extraConfig === 'function'
      ? deserialize(ModelClass, obj, extraConfig(i))
      : deserialize(ModelClass, obj, extraConfig),
  );
}

/**
 * Deserialize an array of objects by calling `deserialize` on each one.
 * You can also pass an `extraConfig` to be used on each `deserialize` call.
 * If you need a different `extraConfig` per model, you can use a function
 * instead that will take the model's index and return a config object.
 * @param {Array<SerializedModel>} modelObjects Array of serialized objects
 * @param {DeserializationConfig | (idx) => DeserializationConfig} extraConfig
 *   An object, or function, with extra information used in deserialization.
 * @returns {ZenArray<Self>}
 */
export function deserializeToZenArray<M: AnyModel & AnySerializable>(
  ModelClass: DeserializableModel<M>,
  modelObjects: Array<Serialized<M>>,
  extraConfig: DeserializationConfig<M> | (number => DeserializationConfig<M>),
): ZenArray<M> {
  return ZenArray.create(
    deserializeArray(ModelClass, modelObjects, extraConfig),
  );
}

/**
 * Deserialize a map of objects by calling `deserialize` on each one.
 * You can also pass an `extraConfig` to be used on each `deserialize` call.
 * If you need a different `extraConfig` per model, you can use a function
 * instead that will take the model's key and return a config object.
 * @param {Object<SerializedModel>} modelObjects Map of objects to deserialize
 * @param {DeserializationConfig | (key) => DeserializationConfig} extraConfig
 *   An object, or function, with extra information used in deserialization.
 * @returns {Object<Self>}
 */
export function deserializeMap<M: AnyModel & AnySerializable>(
  ModelClass: DeserializableModel<M>,
  modelObjects: { [string]: Serialized<M> },
  extraConfig: DeserializationConfig<M> | (string => DeserializationConfig<M>),
): { [string]: M } {
  const deserializedObj = {};
  Object.keys(modelObjects).forEach(key => {
    if (extraConfig && typeof extraConfig === 'function') {
      deserializedObj[key] = deserialize(
        ModelClass,
        modelObjects[key],
        extraConfig(key),
      );
    } else {
      deserializedObj[key] = deserialize(
        ModelClass,
        modelObjects[key],
        extraConfig,
      );
    }
  });
  return deserializedObj;
}

/**
 * Deserialize a map of objects by calling `deserialize` on each one.
 * You can also pass an `extraConfig` to be used on each `deserialize` call.
 * If you need a different `extraConfig` per model, you can use a function
 * instead that will take the model's key and return a config object.
 * @param {Object<SerializedModel>} modelObjects Map of objects to deserialize
 * @param {DeserializationConfig | (key) => DeserializationConfig} extraConfig
 *   An object, or function, with extra information used in deserialization.
 * @returns {ZenMap<Self>}
 */
export function deserializeToZenMap<M: AnyModel & AnySerializable>(
  ModelClass: DeserializableModel<M>,
  modelObjects: { [string]: Serialized<M> },
  extraConfig: DeserializationConfig<M> | (string => DeserializationConfig<M>),
): ZenMap<M> {
  return ZenMap.create(deserializeMap(ModelClass, modelObjects, extraConfig));
}
