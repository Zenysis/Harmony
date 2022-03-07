// @flow
import Promise from 'bluebird';

import ZenArray from 'lib/Zen/ZenArray';
import ZenMap from 'lib/Zen/ZenMap';
import type { AnyModel } from 'lib/Zen/ZenModel';

export interface Deserializable<
  // eslint-disable-next-line no-unused-vars
  SerializedValue,
  // eslint-disable-next-line no-unused-vars
  DeserializationConfig = $AllowAny,
> {}

export interface Serializable<
  SerializedValue,
  DeserializationConfig = $AllowAny, // eslint-disable-line no-unused-vars
> {
  /**
   * Convert this instance into its SerializedValue
   * @returns {SerializedValue}
   */
  serialize(): SerializedValue;
}

type AnySerializable = Serializable<$AllowAny, $AllowAny>;
type AnyDeserializable = Deserializable<$AllowAny, $AllowAny>;

export type Serialized<T: AnySerializable | AnyDeserializable> = $Call<
  (<SV>(Serializable<SV, any>) => SV) & (<SV>(Deserializable<SV, any>) => SV),
  T,
>;

export type DeserializationConfig<
  T: AnySerializable | AnyDeserializable,
> = $Call<
  (<DC>(Serializable<any, DC>) => DC) & (<DC>(Deserializable<any, DC>) => DC),
  T,
>;

export type DeserializableModel<M: AnyModel & AnyDeserializable> = Class<M> & {
  +deserialize: (
    values: Serialized<M>,
    extraConfig: DeserializationConfig<M>,
  ) => M,
  ...
};

export type DeserializableAsyncModel<
  M: AnyModel & AnyDeserializable,
> = Class<M> & {
  +deserializeAsync: (
    values: Serialized<M>,
    extraConfig: DeserializationConfig<M>,
  ) => Promise<M>,
  ...
};

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
declare function serializeMap<M: AnySerializable>(
  models: ZenMap<M>
): { [string]: Serialized<M>, ... };
declare function serializeMap<T, M: AnySerializable>(
  models: { +[T]: M, ... }
): { [T]: Serialized<M>, ... };
*/
export function serializeMap<T, M: AnySerializable>(
  models: { +[T]: M, ... } | ZenMap<M>,
): { [T]: Serialized<M>, ... } {
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
 * Deserialize an array of objects by calling `deserialize` on each one.
 * You can also pass an `extraConfig` to be passed to each `deserialize`
 * call.
 * @param {DeserializableModel<M>} ModelClass The model class to use for
 * deserialization.
 * @param {Array<SerializedModel>} modelObjects Array of serialized objects
 * @param {DeserializationConfig} extraConfig
 *   An object with extra information used in deserialization.
 * @returns {Array<Self>}
 */
export function deserializeArray<M: AnyModel & AnyDeserializable>(
  ModelClass: DeserializableModel<M>,
  modelObjects: $ReadOnlyArray<Serialized<M>>,
  extraConfig: DeserializationConfig<M>,
): Array<M> {
  return modelObjects.map(obj => ModelClass.deserialize(obj, extraConfig));
}

/**
 * Deserialize an array of objects by calling `deserializeAsync` on each one.
 * You can also pass an `extraConfig` to be passed to each `deserializeAsync`
 * call.
 * @param {DeserializableModel<M>} ModelClass The model class to use for
 * deserialization.
 * @param {Array<SerializedModel>} modelObjects Array of serialized objects
 * @param {DeserializationConfig} extraConfig
 *   An object with extra information used in deserialization.
 * @returns {Array<Self>}
 */
export function deserializeAsyncArray<M: AnyModel & AnyDeserializable>(
  ModelClass: DeserializableAsyncModel<M>,
  modelObjects: $ReadOnlyArray<Serialized<M>>,
  extraConfig: DeserializationConfig<M>,
): Promise<Array<M>> {
  return Promise.all(
    modelObjects.map(obj => ModelClass.deserializeAsync(obj, extraConfig)),
  );
}

/**
 * Deserialize an array of objects by calling `deserialize` on each one.
 * You can also pass an `extraConfig` to be used on each `deserialize` call.
 * @param {DeserializableModel<M>} ModelClass The model class to use for
 * deserialization.
 * @param {Array<SerializedModel>} modelObjects Array of serialized objects
 * @param {DeserializationConfig} extraConfig
 *   An object with extra information used in deserialization.
 * @returns {ZenArray<Self>}
 */
export function deserializeToZenArray<M: AnyModel & AnyDeserializable>(
  ModelClass: DeserializableModel<M>,
  modelObjects: $ReadOnlyArray<Serialized<M>>,
  extraConfig: DeserializationConfig<M>,
): ZenArray<M> {
  return ZenArray.create(
    deserializeArray(ModelClass, modelObjects, extraConfig),
  );
}

/**
 * Deserialize a map of objects by calling `deserialize` on each one.
 * You can also pass an `extraConfig` to be used on each `deserialize` call.
 * @param {DeserializableModel<M>} ModelClass The model class to use for
 * deserialization.
 * @param {Object<SerializedModel>} modelObjects Map of objects to deserialize
 * @param {DeserializationConfig} extraConfig
 *   An object with extra information used in deserialization.
 * @returns {Object<Self>}
 */
export function deserializeMap<M: AnyModel & AnyDeserializable>(
  ModelClass: DeserializableModel<M>,
  modelObjects: { +[string]: Serialized<M>, ... },
  extraConfig: DeserializationConfig<M>,
): { [string]: M, ... } {
  const deserializedObj = {};
  Object.keys(modelObjects).forEach(key => {
    deserializedObj[key] = ModelClass.deserialize(
      modelObjects[key],
      extraConfig,
    );
  });
  return deserializedObj;
}

/**
 * Deserialize a map of objects by calling `deserialize` on each one.
 * You can also pass an `extraConfig` to be used on each `deserialize` call.
 * @param {DeserializableModel<M>} ModelClass The model class to use for
 * deserialization.
 * @param {Object<SerializedModel>} modelObjects Map of objects to deserialize
 * @param {DeserializationConfig} extraConfig
 *   An object with extra information used in deserialization.
 * @returns {ZenMap<Self>}
 */
export function deserializeToZenMap<M: AnyModel & AnyDeserializable>(
  ModelClass: DeserializableModel<M>,
  modelObjects: { +[string]: Serialized<M>, ... },
  extraConfig: DeserializationConfig<M>,
): ZenMap<M> {
  return ZenMap.create(deserializeMap(ModelClass, modelObjects, extraConfig));
}
