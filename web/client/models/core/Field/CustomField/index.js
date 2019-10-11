// @flow
import PropTypes from 'prop-types';

import Field from 'models/core/Field';
import Formula from 'models/core/Field/CustomField/Formula';
import FormulaMetadata from 'models/core/Field/CustomField/Formula/FormulaMetadata';
import ZenModel, { def } from 'util/ZenModel';
import override from 'decorators/override';
import { uniqueId } from 'util/util';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';

export type SerializedCustomField = {
  id: string,
  fieldIds: Array<string>,
  name: string,
  formula: string,
};

/**
 * This represents a custom field calculated from a Formula.
 * CustomFields cannot be queried for. CustomFields are evaluated post-query,
 * because they are constructed from the queried data.
 * After data is loaded, the custom fields are applied to a QueryResultDataModel
 * in order to evaluate them with the data returned from the backend.
 */
export default class CustomField extends Field.withTypes({
  /**
   * The custom formula that represents this field.
   */
  formula: def(PropTypes.instanceOf(Formula).isRequired),

  /**
   * The type of this field. Defaults to CUSTOM.
   * Do not change it.
   *
   * The id is always uniquely generated, instead of being
   * derived from the field's label, to support editing CustomField
   */
  type: def(PropTypes.string, Field.Types.CUSTOM, ZenModel.PRIVATE),
}) {
  static create(values: { formula: Formula, id?: string, label: string }) {
    const { formula, id, label } = values;
    return new CustomField({
      label,
      formula,
      id: id || `custom_field_${uniqueId()}`,
      type: Field.Types.CUSTOM,
    });
  }

  // NOTE(stephen): Need access to a version of SeriesSettings that we can
  // build Field objects with a valid label. This is a workaround to the more
  // general problem that CustomField should not store references to Fields at
  // all in its entire chain.
  static deserialize(
    customFieldObj: SerializedCustomField,
    extraConfig: { seriesSettings: SeriesSettings },
  ) {
    const { name, fieldIds, formula } = customFieldObj;
    const seriesObjects = extraConfig.seriesSettings.seriesObjects();
    // TODO(pablo): this is not a correct deserialization and will cause issues
    // once we allow Custom Calculations to be edited. The issue is that when
    // we encounter a fieldId that belongs to a CustomField, we should have
    // already deserialied it previously, and we should be re-using that
    // CustomField.
    const fields = fieldIds.map(id => {
      const label =
        seriesObjects[id] !== undefined ? seriesObjects[id].label() : id;
      const type = id.startsWith('custom_field_')
        ? Field.Types.CUSTOM
        : Field.Types.FIELD;
      return Field.create({
        id,
        label,
        type,
      });
    });

    const metadataModel = FormulaMetadata.deserialize({ formula }, { fields });
    const formulaModel = Formula.create({ metadata: metadataModel });
    return CustomField.create({
      formula: formulaModel,
      id: customFieldObj.id,
      label: name,
    });
  }

  @override
  getCanonicalName(): this {
    return this.label();
  }

  /**
   * Convert to a JSON object as it is stored in the backend
   * (we omit the canonicalNameMap, as that's not necessary to store)
   */
  @override
  serialize(): SerializedCustomField {
    const { id, label, formula } = this.modelValues();
    const { text, fields } = formula.modelValues();
    return {
      id,
      fieldIds: fields.pull('id').serialize(),
      name: label,
      formula: text,
    };
  }
}
