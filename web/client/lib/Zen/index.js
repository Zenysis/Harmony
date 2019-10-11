// @flow
import ZenArray from 'util/ZenModel/ZenArray';
import ZenMap from 'util/ZenModel/ZenMap';
import ZenModel, {
  hasChanged,
  hasChangedDeep,
  statefulCompute,
} from 'lib/Zen/ZenModel';
import ZenModelUtil from 'lib/Zen/ZenModel/ZenModelUtil';
import cast from 'lib/Zen/util/cast';
import {
  deserialize,
  deserializeArray,
  deserializeToZenArray,
  deserializeMap,
  deserializeToZenMap,
  serializeArray,
  serializeMap,
} from 'lib/Zen/util/serializationUtil';
import type {
  AllValues,
  AnyModel,
  ComputeDerivedValueFn,
  CreationValues,
  Model,
  ModelValueKeys,
  ReadOnly,
  ShouldRecomputeFn,
  StatefulComputeDerivedValueFn,
} from 'lib/Zen/ZenModel';
import type {
  DeserializableClass,
  DeserializableModel,
  DeserializationConfig,
  Serializable,
  Serialized,
} from 'lib/Zen/util/serializationUtil';

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
 *   - Zen.deserialize
 *   - Zen.deserializeArray
 *   - Zen.deserializeToZenArray
 *   - Zen.deserializeMap
 *   - Zen.deserializeToZenMap
 *   - Zen.serializeArray
 *   - Zen.serializeMap
 *
 * Utility types:
 *   - Zen.AnyModel
 *   - Zen.Model<M>
 *   - Zen.ModelValues<M>
 *   - Zen.ModelValueKeys<M>
 *   - Zen.ComputeDerivedValueFn<V, M>
 *   - Zen.ReadOnly<T>
 *   - Zen.ShouldRecomputeFn<M>
 *   - Zen.StatefulComputeDerivedValueFn<V, M>
 *   - Zen.Serialized<M>
 *   - Zen.DeserializationConfig<M>
 *
 * Interfaces:
 *   (due to Flow's parser, interfaces must be imported separately and cannot
 *   be used with the `Zen.` namespace)
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
  DeserializableClass,
  DeserializableModel,
  DeserializationConfig,
  Model,
  ModelValueKeys,
  ComputeDerivedValueFn,
  CreationValues,
  ReadOnly,
  Serializable,
  Serialized,
  ShouldRecomputeFn,
  StatefulComputeDerivedValueFn,
};
export type ModelValues<M: AnyModel> = AllValues<M>;

// helper functions
export {
  cast,
  deserialize,
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

// default export (in case someone doesn't import using 'import * as Zen')
const DefaultZenExport = {
  // classes
  Array,
  BaseModel,
  Map,
  ModelUtil,

  // functions
  cast,
  deserialize,
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
