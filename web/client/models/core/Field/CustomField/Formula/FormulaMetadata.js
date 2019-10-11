// @flow
import * as Zen from 'lib/Zen';
import FormulaCursor from 'models/QueryResult/QueryResultActionButtons/CustomCalculationsModal/FormulaCursor';
import LegacyField from 'models/core/Field';
import PlaceholderFieldTag from 'components/QueryResult/QueryResultActionButtons/CustomCalculationsModal/PlaceholderFieldTag';
import checkValidity from 'models/core/Field/CustomField/Formula/checkValidity';
import {
  escapeHTML,
  findAllIndices,
  generateRandomString,
  replaceAll,
  replaceAt,
} from 'util/stringUtil';

function _sortFields(fields: Zen.Array<LegacyField>): Zen.Array<LegacyField> {
  return fields.sort((f1, f2) => f2.label().length - f1.label().length);
}

type DefaultValues = {
  /**
   * The formula represented as an array of lines so it can be rendered
   * in a FormulaEditor
   */
  lines: Zen.Array<string>,

  /**
   * An array of fields that this calculation depends on.
   */
  fields: Zen.Array<LegacyField>,
};

type DerivedValues = {
  /**
   * Array of fields sorted by label length (longest ones first)
   */
  sortedFields: Zen.Array<LegacyField>,

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
};

class FormulaMetadata extends Zen.BaseModel<
  FormulaMetadata,
  {},
  DefaultValues,
  DerivedValues,
> {
  static defaultValues = {
    lines: Zen.Array.create(['']),
    fields: Zen.Array.create(),
  };

  static derivedConfig = {
    sortedFields: [
      Zen.hasChanged<FormulaMetadata>('fields'),
      formula => _sortFields(formula.fields()),
    ],
    isValid: [
      Zen.hasChanged<FormulaMetadata>('lines'),
      formula => checkValidity(formula).isValid,
    ],
    validityMessage: [
      Zen.hasChanged<FormulaMetadata>('lines'),
      formula => checkValidity(formula).message,
    ],
  };

  static deserialize(
    { formula }: SerializedFormulaMetadata,
    extraConfig: { fields: $ReadOnlyArray<LegacyField> },
  ): Zen.Model<FormulaMetadata> {
    const { fields } = extraConfig;

    // Sort field IDs in descending order from longest to shortest and by
    // alpha sort (reversed) if the length is the same. This sort is stable.
    // NOTE(stephen): This is duplicated with _sortFields except it uses ID
    // instead of label. We want to sort by ID here since we are replacing the
    // field ID strings with the full field label. The _sortFields method is
    // used when the opposite is needed: replace the full field label with the
    // field ID.
    const sortedFields = fields.slice().sort((a, b) => {
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
          (fullLine, field) => replaceAll(fullLine, field.id(), field.label()),
          line,
        ),
      );

    return FormulaMetadata.create({
      fields: Zen.Array.create(fields),
      lines: Zen.Array.create(lines),
    });
  }

  getJSFormulaText(): string {
    // Iterate over the fields and replace their labels with their IDs
    // This requires that all fields have unique labels
    // HACK(pablo): We need to sort by longest fields (because
    // some field labels may be subsets of larger fields). Ideally we just
    // don't use field labels (other than when rendering in HTML) - we should
    // use Field ids.
    // HACK(pablo): another hack. This is a mess. We still have to account
    // for the fact that some field IDs can be subsets of other field IDs
    // (e.g. custom_field_test and custom_field_test2). So we need to do
    // this in two parts. First pass: convert all field IDs to a randomized
    // string to avoid any possible subset collisions. Then do a replaceAll.
    // Second pass: now replace all the randomized IDs with their real ID.
    // TODO(pablo): completely redesign how formulas are represented.
    const fieldLabelToTempId = {};
    const tempIdToFieldId = {};
    this._.sortedFields().forEach(field => {
      const tempId = generateRandomString();
      fieldLabelToTempId[field.label()] = tempId;
      tempIdToFieldId[tempId] = field.jsIdentifier();
    });

    const firstPassText = this._.sortedFields().reduce(
      (text, field) =>
        replaceAll(text, field.label(), fieldLabelToTempId[field.label()]),
      this._.lines().join(' '),
    );

    const finalText = Object.keys(tempIdToFieldId).reduce(
      (text, tempId) => replaceAll(text, tempId, tempIdToFieldId[tempId]),
      firstPassText,
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
        const fieldText = field.label();
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
                field,
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
    field: LegacyField,
    formulaCursor: FormulaCursor,
  ): Zen.Model<FormulaMetadata> {
    const { end, start } = formulaCursor.modelValues();
    const fieldText = `${field.label()} `;

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

    const oldFields = this._.fields();
    const newFields = oldFields.push(field);

    return this.modelValues({
      lines: newLines,
      fields: newFields,
    });
  }

  removeField(
    field: LegacyField,
    lineNumber: number,
    startIndex: number,
    endIndex: number,
  ): Zen.Model<FormulaMetadata> {
    const newLines = this._.lines().apply(lineNumber, line =>
      replaceAt(line, '', startIndex, endIndex),
    );

    const fieldId = field.id();
    return this.modelValues({
      lines: newLines,
      fields: this._.fields().findAndDelete(f => f.id() === fieldId),
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

export default ((FormulaMetadata: any): Class<Zen.Model<FormulaMetadata>>);
