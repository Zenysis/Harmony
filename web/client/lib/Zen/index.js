// @flow
import ZenArray from 'lib/Zen/ZenArray';
import ZenMap from 'lib/Zen/ZenMap';
import ZenModel from 'lib/Zen/ZenModel';
import ZenModelUtil from 'lib/Zen/ZenModel/ZenModelUtil';
import cast from 'lib/Zen/util/cast';
import {
  deserializeArray,
  deserializeAsyncArray,
  deserializeToZenArray,
  deserializeMap,
  deserializeToZenMap,
  serializeArray,
  serializeMap,
} from 'lib/Zen/util/serializationUtil';
import {
  hasChanged,
  hasChangedDeep,
  statefulCompute,
} from 'lib/Zen/ZenModel/coreHelpers';
import type {
  AnyModel,
  ComputeDerivedValueFn,
  CreationValues,
  DerivedConfig,
  Model,
  ShouldRecomputeFn,
  StatefulComputeDerivedValueFn,
} from 'lib/Zen/ZenModel';
import type {
  Deserializable,
  DeserializableModel,
  DeserializationConfig,
  Serializable,
  Serialized,
} from 'lib/Zen/util/serializationUtil';
import type {
  ModelValues,
  ModelValueKeys,
  SettableValues,
  SettableValueKeys,
  SettableValueType,
} from 'lib/Zen/ZenModel/coreHelpers';

/**
 * This is a collection of all our exports for the Zen library.
 *
 * Classes:
 *   - Zen.Array
 *   - Zen.BaseModel
 *   - Zen.Map
 *   - Zen.ModelUtil
 *
 * Functions:
 *   - Zen.hasChanged
 *   - Zen.hasChangedDeep
 *   - Zen.statefulCompute
 *   - Zen.cast<T>
 *
 * Serialize/Deserialize Functions:
 *   - Zen.deserializeArray
 *   - Zen.deserializeToZenArray
 *   - Zen.deserializeMap
 *   - Zen.deserializeToZenMap
 *   - Zen.serializeArray
 *   - Zen.serializeMap
 *
 * Utility types:
 *   - Zen.AnyModel
 *   - Zen.DeserializationConfig<M>
 *   - Zen.DeserializableModel<M>
 *   - Zen.Model<M>
 *   - Zen.ModelValues<M>
 *   - Zen.ModelValueKeys<M>
 *   - Zen.ComputeDerivedValueFn<V, M>
 *   - Zen.SettableValues<T>
 *   - Zen.SettableValueKeys<T>
 *   - Zen.SettableValueType<T>
 *   - Zen.ShouldRecomputeFn<M>
 *   - Zen.StatefulComputeDerivedValueFn<V, M>
 *   - Zen.Serialized<M>
 *
 * Interfaces:
 *   (due to Flow's parser, interfaces must be imported separately and cannot
 *   be used with the `Zen.` namespace)
 *   - Deserializable<SerializedModel, DeserializationConfig>
 *   - Serializable<SerializedModel, DeserializationConfig>
 *
 * @version 1.0.0
 */

// Main classes
export const Array = ZenArray;
export const BaseModel = ZenModel;
export const Map = ZenMap;
export const ModelUtil = ZenModelUtil;

// helper types and interfaces
export type {
  AnyModel,
  DerivedConfig,
  Deserializable,
  DeserializableModel,
  DeserializationConfig,
  Model,
  ModelValues,
  ModelValueKeys,
  ComputeDerivedValueFn,
  CreationValues,
  Serializable,
  Serialized,
  SettableValues,
  SettableValueKeys,
  SettableValueType,
  ShouldRecomputeFn,
  StatefulComputeDerivedValueFn,
};

// helper functions
export {
  cast,
  deserializeArray,
  deserializeAsyncArray,
  deserializeToZenArray,
  deserializeMap,
  deserializeToZenMap,
  hasChanged,
  hasChangedDeep,
  serializeArray,
  serializeMap,
  statefulCompute,
};

// default export (in case someone doesn't import using 'import * as Zen')
const DefaultZenExport = {
  // classes
  Array,
  BaseModel,
  Map,
  ModelUtil,

  // functions
  cast,
  deserializeArray,
  deserializeToZenArray,
  deserializeMap,
  deserializeToZenMap,
  hasChanged,
  hasChangedDeep,
  serializeArray,
  serializeMap,
  statefulCompute,
};

export default DefaultZenExport;
