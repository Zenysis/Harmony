// @flow
/**
 * NOTE: This function is a PRIVATE helper function used only by the Zen
 * library. It should not be used outside of this library.
 *
 * Given a value, convert all ZenModels within it into objects.
 * If the value is not a ZenModel, leave it as is.
 *
 * There is no way to infer the returned type here, so we return `mixed`.
 */
export default function convertZenModels(value: any): mixed {
  if (value && value.serialize && typeof value.serialize === 'function') {
    return value.serialize();
  }
  if (Array.isArray(value)) {
    return value.map(convertZenModels);
  }
  if (value !== null && typeof value === 'object') {
    const newValue = {};
    Object.keys(value).forEach(key => {
      newValue[key] = convertZenModels(value[key]);
    });
    return newValue;
  }
  return value;
}
