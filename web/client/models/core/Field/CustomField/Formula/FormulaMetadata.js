// @flow
import * as Zen from 'lib/Zen';
import FormulaCursor from 'models/QueryResult/QueryResultActionButtons/CustomCalculationsModal/FormulaCursor';
import PlaceholderFieldTag from 'components/common/CustomCalculationsModal/PlaceholderFieldTag';
import checkValidity from 'models/core/Field/CustomField/Formula/checkValidity';
import {
  escapeHTML,
  findAllIndices,
  generateRandomString,
  replaceAll,
  replaceAt,
} from 'util/stringUtil';
import type { Deserializable } from 'lib/Zen';

// We are using FieldShape type instead of a specific Field model type. This
// allows FieldMetadata to be supported by a broader range of types that includes
// only the bare minimum properties required here.
export type FieldShape = {
  id: () => string,
  getLabel: () => string,
  jsIdentifier: () => string,
};

function _sortFields(fields: Zen.Array<FieldShape>): Zen.Array<FieldShape> {
  return fields.sort((f1, f2) => f2.getLabel().length - f1.getLabel().length);
}

// Convert a string to a valid JS identifiers that can be plugged into a
// formula. Replace all invalid characters with underscores.
export function strToValidIdentifier(str: string): string {
  return str.replace(/\W/g, '_');
}

// A field configuration object stores any special behavior that must
// be applied to a field in a custom calculation. For example, if a field
// should treat any 'No data' (i.e. null/undefined) values as zeros inside
// a custom calculation.
type FieldConfiguration = {
  +fieldId: string,
  +treatNoDataAsZero: boolean,
};

type DefaultValues = {
  /**
   * The formula represented as an array of lines so it can be rendered
   * in a FormulaEditor
   */
  lines: Zen.Array<string>,

  /**
   * An array of all dimensions (represented as ids, e.g. 'RegionName') that
   * is available to this calculation. A date grouping will be labeled as
   * 'timestamp'.
   * NOTE(pablo): for now, this array includes *all* dimensions that the user
   * queried for, and not specifically just the ones that this calculation
   * references. So some dimensions in this array might not be referenced in
   * the formula text.
   */
  dimensions: $ReadOnlyArray<string>,

  /**
   * An array of fields that this calculation depends on.
   */
  fields: Zen.Array<FieldShape>,

  /**
   * A map of field configurations so we can apply any special behaviors
   * to different fields.
   */
  fieldConfigurations: Zen.Map<FieldConfiguration>,
};

type DerivedValues = {
  /**
   * Array of fields sorted by label length (longest ones first)
   */
  sortedFields: Zen.Array<FieldShape>,

  /**
   * Specifies whether the formula is valid or not.
   */
  isValid: boolean,

  /**
   * Provides a specific message explaining a formula's validity.
   */
  validityMessage: string,
};

type SerializedFormulaMetadata = {
  formula: string,

  // NOTE(pablo): on 09/02/2020 this feature was added to Custom Calculations.
  // This object should always exist, but it's possible that AQT tabs that had
  // *already* been persisted to the browser before this feature landed will
  // be missing this object. Or they might have the object, but be missing some
  // fields in it. So we are marking this value as optional, even though that
  // should rarely be the case.
  fieldConfigurations?: { +[fieldId: string]: FieldConfiguration, ... },
};

type DeserializationConfig = {
  dimensions: $ReadOnlyArray<string>,
  fields: $ReadOnlyArray<FieldShape>,

  // An optional array of fields used to replace the formula expression ids.
  // If not provided, will default to use the original fields array.
  matchFields?: $ReadOnlyArray<FieldShape>,
};

/**
 * Initializes a field configuration with default values for each field
 * in an array.
 */
function initializeFieldConfigurations(
  fields: $ReadOnlyArray<FieldShape>,
): { +[fieldId: string]: FieldConfiguration, ... } {
  const fieldConfigs = {};
  fields.forEach(field => {
    const fieldId = field.id();
    fieldConfigs[fieldId] = { fieldId, treatNoDataAsZero: false };
  });
  return fieldConfigs;
}

class FormulaMetadata
  extends Zen.BaseModel<FormulaMetadata, {}, DefaultValues, DerivedValues>
  implements Deserializable<SerializedFormulaMetadata, DeserializationConfig> {
  static defaultValues: DefaultValues = {
    lines: Zen.Array.create(['']),
    dimensions: [],
    fields: Zen.Array.create(),
    fieldConfigurations: Zen.Map.create(),
  };

  static derivedConfig: Zen.DerivedConfig<FormulaMetadata, DerivedValues> = {
    sortedFields: [
      Zen.hasChanged('fields'),
      formula => _sortFields(formula.fields()),
    ],
    isValid: [
      Zen.hasChanged('lines'),
      formula => checkValidity(formula).isValid,
    ],
    validityMessage: [
      Zen.hasChanged('lines'),
      formula => checkValidity(formula).message,
    ],
  };

  static deserialize(
    { formula, fieldConfigurations }: SerializedFormulaMetadata,
    { dimensions, fields, matchFields }: DeserializationConfig,
  ): Zen.Model<FormulaMetadata> {
    // Sort field IDs in descending order from longest to shortest and by
    // alpha sort (reversed) if the length is the same. This sort is stable.
    // NOTE(stephen): This is duplicated with _sortFields except it uses ID
    // instead of label. We want to sort by ID here since we are replacing the
    // field ID strings with the full field label. The _sortFields method is
    // used when the opposite is needed: replace the full field label with the
    // field ID.
    const fieldsToSort = matchFields !== undefined ? matchFields : fields;
    const sortedFields = fieldsToSort.slice().sort((a, b) => {
      const aID = a.id();
      const bID = b.id();

      if (aID.length === bID.length) {
        // NOTE(stephen): Slightly unintiutive locale compare of `b` vs `a`
        // instead of the more common `a` vs `b` since we are sorting in
        // reverse.
        return bID.localeCompare(aID);
      }

      if (aID.length > bID.length) {
        return -1;
      }

      return 1;
    });

    const lines = formula
      .split('\n')
      .map(line =>
        sortedFields.reduce(
          (fullLine, field) =>
            replaceAll(fullLine, field.id(), field.getLabel()),
          line,
        ),
      );

    // NOTE(pablo): on 09/02/2020 the `treatNoDataAsZero` feature was added
    // to Custom Calculations.
    // Due to some AQT tabs having already been persisted prior to the launch
    // of this feature, some FormulaMetadata models might have persisted an
    // incomplete object of field configurations (i.e. some fields might be
    // missing). So we use this function to build a base set of field
    // configurations to make sure all fields are included.
    const baseFieldConfigurations = initializeFieldConfigurations(fields);

    return FormulaMetadata.create({
      dimensions,
      fields: Zen.Array.create(fields),
      lines: Zen.Array.create(lines),
      fieldConfigurations: Zen.Map.create({
        ...baseFieldConfigurations,
        ...fieldConfigurations,
      }),
    });
  }

  /**
   *  Replace all field labels with unique token identifiers.
   *  The reason we do this is because some field labels may be subsets
   *  of other labels (e.g. 'Malaria' and 'Malaria - Female'), which breaks
   *  our usage of string operations such as replaceAll.
   *
   *  @returns {{ lines: ZenArray<string>, labelToTokenMap: Map<string, string>}}
   *    An object consisting of:
   *    `lines`: The new lines with tokenized field
   *    `labelToTokenMap` A mapping of field label to unique token string
   */
  tokenizeLines(): {
    lines: Zen.Array<string>,
    labelToTokenMap: Map<string, string>,
  } {
    // HACK(pablo): We need to sort by longest fields (because
    // some field labels may be subsets of larger fields). Ideally we just
    // don't use field labels (other than when rendering in HTML) - we should
    // use Field ids. But even with field ids we'd still need to tokenize
    // the text, because field ids can still be subsets of others (e.g.
    // 'malaria' and 'malaria_total').
    // HACK(pablo): another hack. This is a mess. We still have to account
    // for the fact that some field IDs can be subsets of other field IDs
    // (e.g. custom_field_test and custom_field_test2). So we need to do
    // this in two parts. First pass: convert all field IDs to a randomized
    // string to avoid any possible subset collisions. Then do a replaceAll.
    // Second pass: now replace all the randomized IDs with their real JS
    // identifier.
    // TODO(pablo): completely redesign how formulas are represented.
    const labels = this._.sortedFields().map(f => f.getLabel());
    const fieldLabelToToken = labels.reduce((map, label) => {
      const token = generateRandomString();

      // make sure no labels are present in our random token, otherwise
      // we'll end up with very weird conflicts.
      // TODO(pablo): This is all haappening because we store field labels
      // direclty instead of ids and oh god it is so painful
      const finalToken = labels.reduce(
        (tkn, lbl) => replaceAll(tkn, lbl, ''),
        token,
      );
      return map.set(label, finalToken);
    }, new Map());

    const newLines = this._.sortedFields().reduce(
      (lines, field) =>
        lines.map(text =>
          replaceAll(
            text,
            field.getLabel(),
            fieldLabelToToken.get(field.getLabel()) || '',
          ),
        ),
      this._.lines(),
    );

    return { lines: newLines, labelToTokenMap: fieldLabelToToken };
  }

  getJSFormulaText(): string {
    // Iterate over the fields and replace their labels with their IDs
    // This requires that all fields have unique labels
    const { lines, labelToTokenMap } = this.tokenizeLines();
    const tokenToJSIdentifier = new Map<string, string>();
    this._.sortedFields().forEach(field => {
      const token = labelToTokenMap.get(field.getLabel());
      if (token) {
        tokenToJSIdentifier.set(token, field.jsIdentifier());
      }
    });

    const finalText = [...tokenToJSIdentifier.entries()].reduce(
      (text, [token, jsIdentifier]) => replaceAll(text, token, jsIdentifier),
      lines.join(' '),
    );
    return finalText;
  }

  getBackendFormulaText(): string {
    // Iterate over the fields and replace their labels with their IDs
    // This requires that all fields have unique labels
    const { lines, labelToTokenMap } = this.tokenizeLines();
    const tokenToId = new Map<string, string>();
    this._.sortedFields().forEach(field => {
      const token = labelToTokenMap.get(field.getLabel());
      if (token) {
        tokenToId.set(token, field.id());
      }
    });

    const finalText = [...tokenToId.entries()].reduce(
      (text, [token, id]) => replaceAll(text, token, id),
      lines.join(' '),
    );
    return finalText;
  }

  getHTML(mode: 'editor' | 'viewer'): string {
    // Replace all instances of fields with a placeholder span,
    // to be later filled with a React <Tag> component
    // Due to using a contentEditable div, we can't just add children to the
    // div. The div's HTML has to be set directly. But if we do that, JS event
    // handlers no longer work. So we need to attach the React components
    // afterwards in componentDidUpdate.
    // To make things more painful, we also need each placeholder to store
    // the indices they are at, so that if the user deletes the tag we can
    // delete the correct substring and reset the cursor correctly.

    const newLines = this._.lines().map((line, lineNumber) => {
      // Find all the fields that need to be replaced in this line
      const replacements = [];

      // HACK(pablo): sort longer fields first, so we don't match the field
      // names that are subset of longer ones first. We should avoid this by
      // using tags that have data- elements that keep track of the field id
      // and char position. That way we can use field IDs in the formula,
      // instead of field label.
      this._.sortedFields().forEach(field => {
        const fieldText = field.getLabel();
        const fieldLength = fieldText.length;
        const startIndices = findAllIndices(line, fieldText);
        startIndices.forEach(startIdx => {
          const endIdx = startIdx + fieldLength;
          const alreadyReplaced = replacements.some(
            replacement =>
              startIdx >= replacement.startIndex &&
              endIdx <= replacement.endIndex,
          );
          if (!alreadyReplaced) {
            replacements.push({
              startIndex: startIdx,
              endIndex: endIdx,
              replacement: PlaceholderFieldTag.asHTML({
                fieldId: field.id(),
                label: fieldText,
                lineNumber,
                startIndex: startIdx,
                mode,
              }),
            });
          }
        });
      });
      replacements.sort((a, b) => a.startIndex - b.startIndex);

      if (replacements.length === 0) {
        return escapeHTML(line);
      }

      // Replace all the necessary parts of this line
      const lineParts = [];
      let currIndex = 0;
      replacements.forEach(({ replacement, startIndex, endIndex }) => {
        const substrBeforeReplacement = line.substring(currIndex, startIndex);
        lineParts.push(escapeHTML(substrBeforeReplacement));
        lineParts.push(replacement);
        currIndex = endIndex;
      });
      lineParts.push(escapeHTML(line.substring(currIndex)));
      return lineParts.join('');
    });

    const htmlLines = newLines.map(
      line =>
        `<div class="custom-calculations-formula-${mode}__line" data-id="formula-line">${line}<br /></div>`,
    );

    return htmlLines.join('');
  }

  addField(
    fieldConfig: {
      fieldId: string,
      fieldLabel: string,
      treatNoDataAsZero: boolean,
    },
    formulaCursor: FormulaCursor,
  ): Zen.Model<FormulaMetadata> {
    const { fieldId, fieldLabel, treatNoDataAsZero } = fieldConfig;
    const { end, start } = formulaCursor.modelValues();
    const fieldText = `${fieldLabel} `;

    // Update the text
    let newLines = this._.lines();
    // TODO(Pablo) multiple lines doesn't seem to work in general
    // If you try to drag an indicator into the input, it breaks completely
    // if (start.lineNumber() === end.lineNumber()) {
    // Updating a single line: just replace the [start, end]
    // range with fieldText
    newLines = newLines.apply(start.lineNumber(), line =>
      replaceAt(line, fieldText, start.offset(), end.offset()),
    );
    // TODO(pablo): this was commented out a while ago by Kyle, figure out why
    // and how to get it working again to properly
    // } else {
    //   // Updating multiple lines (if we had been highlighting
    //   // across multiple lines)
    //   // 1. replace fieldText into the starting line
    //   // 2. Delete last line up until end.offset
    //   // 3. Delete all intermediate lines
    //   newLines = newLines
    //     .apply(start.lineNumber(), line => (
    //       replaceAt(line, fieldText, start.offset(), line.length)
    //     ))
    //     .apply(end.lineNumber(), line => line.slice(end.offset()));

    //   const linesToDelete = end.lineNumber() - start.lineNumber() - 1;
    //   if (linesToDelete > 0) {
    //     newLines = newLines.splice(start.lineNumber() + 1, linesToDelete);
    //   }
    // }
    const jsIdentifier = strToValidIdentifier(fieldId);
    const field = {
      id: () => fieldId,
      getLabel: () => fieldLabel,
      jsIdentifier: () => jsIdentifier,
    };
    const oldFields = this._.fields();
    const newFields = oldFields.push(field);
    const oldFieldConfigurations = this._.fieldConfigurations();
    return this.modelValues({
      lines: newLines,
      fields: newFields,
      fieldConfigurations: oldFieldConfigurations.set(fieldId, {
        fieldId,
        treatNoDataAsZero,
      }),
    });
  }

  removeField(
    fieldId: string,
    lineNumber: number,
    startIndex: number,
    endIndex: number,
  ): Zen.Model<FormulaMetadata> {
    const newLines = this._.lines().apply(lineNumber, line =>
      replaceAt(line, '', startIndex, endIndex),
    );

    const oldFieldConfigurations = this._.fieldConfigurations();
    return this.modelValues({
      lines: newLines,
      fields: this._.fields().findAndDelete(f => f.id() === fieldId),
      fieldConfigurations: oldFieldConfigurations.delete(fieldId),
    });
  }

  addSymbol(symbol: string, cursor: FormulaCursor): Zen.Model<FormulaMetadata> {
    const { end, start } = cursor.modelValues();

    const newLines = this._.lines().apply(start.lineNumber(), line =>
      replaceAt(line, symbol, start.offset(), end.offset()),
    );

    return this._.lines(newLines);
  }
}

export default ((FormulaMetadata: $Cast): Class<Zen.Model<FormulaMetadata>>);
