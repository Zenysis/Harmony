// @flow
import * as Zen from 'lib/Zen';
import Field from 'models/core/wip/Field';
import Formula from 'models/core/Field/CustomField/Formula';
import FormulaMetadata from 'models/core/Field/CustomField/Formula/FormulaMetadata';
import { replaceAll } from 'util/stringUtil';
import { uniqueId } from 'util/util';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type { GroupingItem } from 'models/core/wip/GroupingItem/types';
import type { Serializable } from 'lib/Zen';

type RequiredValues = {
  /** The custom formula that represents this field. */
  formula: Formula,
  id: string,
  label: string,
};

type SerializedCustomField = {
  ...Zen.Serialized<FormulaMetadata>,
  id: string,
  fieldIds: $ReadOnlyArray<string>,
  name: string,
};

type DeserializationConfig = {
  seriesSettings: SeriesSettings,
  dimensions: $ReadOnlyArray<string>,
};

// the dimension id to use in formulas for date grouping dimensions
const DATE_DIMENSION_FORMULA_ID = 'timestamp';

/**
 * Given a GroupingItem from a query selection, extract the dimension id that we
 * can use in a custom field's formula. We have special treatment for date
 * granularities, where the id should always be 'timestamp'
 */
export function getDimensionIdForCustomField(group: GroupingItem): string {
  switch (group.tag) {
    case 'GROUPING_GRANULARITY':
      return DATE_DIMENSION_FORMULA_ID;
    case 'GROUPING_DIMENSION':
      return group.dimension();
    default:
      (group.tag: empty);
      throw new Error(`Invalid group type received: '${group.tag}'`);
  }
}

/**
 * This represents a custom field calculated from a Formula.
 * CustomFields cannot be queried for. CustomFields are evaluated post-query,
 * because they are constructed from the queried data.
 * After data is loaded, the custom fields are applied to a QueryResultDataModel
 * in order to evaluate them with the data returned from the backend.
 */
class CustomField extends Zen.BaseModel<CustomField, RequiredValues>
  implements Serializable<SerializedCustomField, DeserializationConfig> {
  static createWithUniqueId(values: {
    formula: Formula,
    label: string,
  }): Zen.Model<CustomField> {
    const { formula, label } = values;
    return CustomField.create({
      label,
      formula,
      id: `custom_field_${uniqueId()}`,
    });
  }

  // NOTE(stephen): Need access to a version of SeriesSettings that we can
  // build Field objects with a valid label. This is a workaround to the more
  // general problem that CustomField should not store references to Fields at
  // all in its entire chain.
  static deserialize(
    customFieldObj: SerializedCustomField,
    extraConfig: DeserializationConfig,
  ): Zen.Model<CustomField> {
    const { name, fieldIds, formula, fieldConfigurations } = customFieldObj;
    const seriesObjects = extraConfig.seriesSettings.seriesObjects();
    // TODO(pablo): this is not a correct deserialization and will cause issues
    // once we allow Custom Calculations to be edited. The issue is that when
    // we encounter a fieldId that belongs to a CustomField, we should have
    // already deserialied it previously, and we should be re-using that
    // CustomField.
    const fields = fieldIds.map(id => {
      const seriesObject = seriesObjects[id];

      // HACK(stephen): Never let series objects have an empty label. This will
      // blow up the FormulaMetadata deserialization which will try to replace
      // an empty string with a value, causing a very long garbage value to be
      // produced
      let label = id;
      if (seriesObject !== undefined && seriesObject.label().length > 0) {
        label = seriesObject.label();
      }

      const jsIdentifier = Field.strToValidIdentifier(id);
      return {
        id: () => id,
        getLabel: () => label,
        jsIdentifier: () => jsIdentifier,
      };
    });

    const metadataModel = FormulaMetadata.deserialize(
      { formula, fieldConfigurations },
      { fields, dimensions: extraConfig.dimensions },
    );
    const formulaModel = Formula.create({ metadata: metadataModel });
    return CustomField.create({
      formula: formulaModel,
      id: customFieldObj.id,
      label: name,
    });
  }

  getCanonicalName(): string {
    return this._.label();
  }

  /**
   * Update the label of any internal fields that are held by this custom field.
   * @param {string} fieldId The field id whose label we want to change
   * @param {string} newFieldLabel The new label of the internal field
   */
  updateInternalFieldLabel(
    fieldId: string,
    newFieldLabel: string,
  ): Zen.Model<CustomField> {
    const formulaMetadata = this._.formula().metadata();
    const internalFields = formulaMetadata.fields();
    const fieldToUpdate = internalFields.find(f => f.id() === fieldId);

    if (fieldToUpdate) {
      // we need to change the actual formula text to replace any references
      // of the old label with the new one
      const { lines, labelToTokenMap } = formulaMetadata.tokenizeLines();
      const oldLabels = [...labelToTokenMap.keys()];

      const tokenToLabelMap = new Map<string, string>();
      oldLabels.forEach(label => {
        const token = labelToTokenMap.get(label);
        if (token) {
          tokenToLabelMap.set(token, label);
        }
      });
      // update the old label's token to point to the new label
      tokenToLabelMap.set(
        labelToTokenMap.get(fieldToUpdate.getLabel()) || '',
        newFieldLabel,
      );

      const tokens = [...labelToTokenMap.values()];
      const newLines = tokens.reduce(
        (currLines, token) =>
          currLines.map(text =>
            replaceAll(text, token, tokenToLabelMap.get(token) || ''),
          ),
        lines,
      );

      // now also update the internal field models themselves with the new label
      const newFields = internalFields.map(field => {
        const id = field.id();
        if (id !== fieldId) {
          return field;
        }

        const jsIdentifier = Field.strToValidIdentifier(id);
        return {
          id: () => id,
          getLabel: () => newFieldLabel,
          jsIdentifier: () => jsIdentifier,
        };
      });

      return this._.deepUpdate()
        .formula()
        .metadata()
        .modelValues({
          lines: newLines,
          fields: newFields,
        });
    }
    return this._;
  }

  /**
   * Convert to a JSON object as it is stored in the backend
   * (we omit the canonicalNameMap, as that's not necessary to store)
   */
  serialize(): SerializedCustomField {
    const { id, label, formula } = this.modelValues();
    return {
      id,
      fieldIds: formula
        .fields()
        .pull('id')
        .arrayView(),
      name: label,
      formula: formula.metadata().getJSFormulaText(),
      fieldConfigurations: formula
        .metadata()
        .fieldConfigurations()
        .objectView(),
    };
  }
}

export default ((CustomField: $Cast): Class<Zen.Model<CustomField>>);
