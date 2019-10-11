import Field from 'models/core/Field';

export default class PropertyField extends Field {
  static create(id) {
    return new PropertyField({ id, type: Field.Types.PROPERTY });
  }
}
