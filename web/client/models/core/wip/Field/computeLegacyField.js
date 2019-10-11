// @flow
import LegacyField from 'models/core/Field';
import type Field from 'models/core/wip/Field';

export default function computeLegacyField(field: Field): LegacyField {
  const id = field.id();
  const label = field.label();
  const canonicalNameMap = { [id]: field.canonicalName() };
  return LegacyField.create({ id, canonicalNameMap, label });
}
