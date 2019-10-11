import Field from 'models/core/Field';

export default class MetricField extends Field {
  static create(id) {
    return new MetricField({ id, type: Field.Types.METRIC });
  }
}
