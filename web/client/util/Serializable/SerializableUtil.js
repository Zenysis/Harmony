// @flow
import Serializable from 'util/Serializable';

const SerializableUtil = {
  isSerializableClass<T>(BaseType: Class<T> | ReactPropsCheckType): boolean {
    return (
      BaseType === Serializable || BaseType.prototype instanceof Serializable
    );
  },

  getPropType<T>(
    BaseType: Class<T> | ReactPropsCheckType,
  ): ReactPropsCheckType {
    if (SerializableUtil.isSerializableClass(BaseType)) {
      // $FlowFixMe: Flow cannot deduce the proper type here.
      return BaseType.type();
    }
    // $FlowFixMe: Flow cannot deduce the proper type here
    return BaseType;
  },
};

export default SerializableUtil;
