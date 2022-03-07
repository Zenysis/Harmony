// @flow
import * as React from 'react';
import Promise from 'bluebird';
import ReactDOM from 'react-dom';
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import CursorPosition from 'models/QueryResult/QueryResultActionButtons/CustomCalculationsModal/CursorPosition';
import FormulaCursor from 'models/QueryResult/QueryResultActionButtons/CustomCalculationsModal/FormulaCursor';
import FormulaFieldTag from 'components/common/CustomCalculationsModal/FormulaFieldTag';
import FormulaMetadata from 'models/core/Field/CustomField/Formula/FormulaMetadata';
import autobind from 'decorators/autobind';
import memoizeOne from 'decorators/memoizeOne';
import normalizeARIAName from 'components/ui/util/normalizeARIAName';
import { setCursorInDOM } from 'components/common/CustomCalculationsModal/cursorUtil';
import type { FieldShape } from 'models/core/Field/CustomField/Formula/FormulaMetadata';
import type { FieldTagData } from 'components/common/CustomCalculationsModal/FormulaFieldTag';

type Props = {
  // cursor is a controlled prop, rather than uncontrolled, because when new
  // fields are added or removed, the cursor has to also change. Field changes
  // are controlled by parent components, so the cursor is as well.
  cursor: FormulaCursor,
  formula: FormulaMetadata,
  onFormulaChange: (formula: FormulaMetadata) => void,
  onFormulaCursorChange: (cursor: FormulaCursor) => void,
  onRemoveFieldClick: FieldTagData => void,
  onUpdateFieldConfiguration: (
    fieldId: string,
    treatNoDataAsZeros: boolean,
  ) => void,
};

// Props to ignore when determining if we should re-render
// cursor is important to track, but its change doesn't need to re-render
// the DOM
const PROPS_TO_IGNORE = new Set(['cursor']);

const ARIA_NAME = normalizeARIAName(
  t('QueryApp.CustomCalculationsModal.FormulaPanel.formulaTitle'),
);

export default class FormulaEditor extends React.Component<Props> {
  _divElt: $ElementRefObject<'div'> = React.createRef();
  componentDidMount() {
    this.refreshFieldTags();
  }

  shouldComponentUpdate(nextProps: Props): boolean {
    return Object.keys(nextProps).some(
      propName =>
        !PROPS_TO_IGNORE.has(propName) &&
        this.props[propName] !== nextProps[propName],
    );
  }

  componentDidUpdate() {
    this.refreshFieldTags();
  }

  refreshFieldTags() {
    const { current } = this._divElt;
    if (!current) {
      return;
    }
    const renderPromises = Array.from(
      current.getElementsByClassName(
        'custom-calculations-formula-editor__field-tag',
      ),
    )
      .filter(el => el instanceof HTMLElement)
      .map(
        el =>
          new Promise(resolve => {
            ReactDOM.render(this.getFieldTag(el), el, resolve);
          }),
      );
    Promise.all(renderPromises).then(() => {
      if (this._divElt.current) {
        setCursorInDOM(this._divElt.current, this.props.cursor);
      }
    });
  }

  @memoizeOne
  _getFieldLabelMapHelper(
    fields: Zen.Array<FieldShape>,
  ): { +[string]: string } {
    const output = {};
    fields.forEach(field => {
      output[field.id()] = field.getLabel();
    });
    return output;
  }

  getFieldLabelMap(): { +[string]: string } {
    return this._getFieldLabelMapHelper(this.props.formula.fields());
  }

  getFieldTag(
    placeholderElement: HTMLElement,
  ): React.Element<typeof FormulaFieldTag> {
    const {
      endIndex,
      fieldId,
      lineNumber,
      startIndex,
    } = placeholderElement.dataset;

    const label = this.getFieldLabelMap()[fieldId];
    const fieldConfiguration = this.props.formula
      .fieldConfigurations()
      .get(fieldId, {});

    invariant(
      label,
      `[FormulaEditor] Something went wrong and could not find field ${fieldId}`,
    );

    const treatNoDataAsZero =
      fieldConfiguration.treatNoDataAsZero !== undefined
        ? fieldConfiguration.treatNoDataAsZero
        : false;
    return (
      <FormulaFieldTag
        fieldId={fieldId}
        label={label}
        lineNumber={Number(lineNumber)}
        startIndex={Number(startIndex)}
        endIndex={Number(endIndex)}
        onRemoveClick={this.props.onRemoveFieldClick}
        onUpdateFieldConfiguration={this.props.onUpdateFieldConfiguration}
        treatNoDataAsZero={treatNoDataAsZero}
      />
    );
  }

  getFirstLineMetadata(): { firstLine: string, isOnlyLine: boolean } | void {
    const { current } = this._divElt;
    if (!current) {
      return undefined;
    }

    const divChildren = Array.from(current.children).filter(
      child => child instanceof HTMLDivElement,
    );
    if (divChildren.length === 0) {
      return { firstLine: '', isOnlyLine: true };
    }

    const firstChild = divChildren[0];
    const nestedLines = firstChild.getElementsByClassName(
      'custom-calculations-formula-editor__line',
    );
    const firstLine =
      nestedLines.length === 0
        ? firstChild.textContent
        : nestedLines[0].textContent;
    const isOnlyLine = divChildren.length === 1 && nestedLines.length <= 1;

    return { firstLine, isOnlyLine };
  }

  getFormulaLines(): Array<string> {
    const lines = [];
    const { current } = this._divElt;
    if (current) {
      Array.from(current.children).forEach(child => {
        if (!(child instanceof HTMLDivElement)) {
          return;
        }

        // if text was added through copy/paste, we might have nested lines
        // within a single line
        const nestedLines = child.getElementsByClassName(
          'custom-calculations-formula-editor__line',
        );
        if (nestedLines.length > 0) {
          Array.from(nestedLines).forEach(line => lines.push(line.textContent));
        } else {
          lines.push(child.textContent);
        }
      });
    }
    return lines.length === 0 ? [''] : lines;
  }

  /**
   * Gets the current cursor position from the DOM
   */
  getCursorPosition(): FormulaCursor {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const rangeClone = range.cloneRange();
    const { startContainer, startOffset, endContainer, endOffset } = range;
    const rangeContainerData = [
      [startContainer, startOffset],
      [endContainer, endOffset],
    ];

    const [startPos, endPos] = rangeContainerData.map(
      ([rangeContainer, rangeContainerOffset]) => {
        // Use the selected range's container to get the current line
        const line = rangeContainer.parentElement.closest(
          'div[data-id="formula-line"]',
        );
        if (!line) {
          return CursorPosition.create({});
        }

        const lineNumber = Array.from(line.parentElement.children).indexOf(
          line,
        );

        // Set our cloned range to select the entire line
        rangeClone.selectNodeContents(line);

        // Set our cloned range to end at rangeContainer + offset
        rangeClone.setEnd(rangeContainer, rangeContainerOffset);

        // Convert range to string to get how far into the line we are
        const offset = rangeClone.toString().length;
        return CursorPosition.create({ lineNumber, offset });
      },
    );

    return FormulaCursor.create({
      start: startPos,
      end: endPos,
    });
  }

  @autobind
  parseTagData(tagNode: HTMLElement): FieldTagData {
    return {
      fieldId: tagNode.dataset.fieldId,
      lineNumber: parseInt(tagNode.dataset.lineNumber, 10),
      startIndex: parseInt(tagNode.dataset.startIndex, 10),
      endIndex: parseInt(tagNode.dataset.endIndex, 10),
    };
  }

  @autobind
  backspaceDetectionHelper() {
    if (!this._divElt.current) {
      return;
    }

    const divElt = this._divElt.current.firstElementChild;
    if (!divElt) {
      return;
    }

    const { children } = divElt;
    const cursorIndex = this.getCursorPosition()
      .end()
      .offset();

    // Check all current tags if their index matches the current index
    for (let i = 0; i < children.length; i++) {
      const childElt = children[i];
      // Check that the element is a Tag by checking if it has a fieldId
      if (childElt.dataset.fieldId) {
        const tag = this.parseTagData(childElt);
        if (
          cursorIndex < tag.endIndex + 1 &&
          cursorIndex > tag.startIndex + 1
        ) {
          this.props.onRemoveFieldClick(tag);
        }
      }
    }
  }

  @autobind
  onKeyUp(event: SyntheticKeyboardEvent<HTMLDivElement>) {
    const { formula, onFormulaChange, onFormulaCursorChange } = this.props;
    const newFormula = formula.lines(Zen.Array.create(this.getFormulaLines()));
    onFormulaChange(newFormula);
    onFormulaCursorChange(this.getCursorPosition());

    if (event.key === 'Backspace') {
      this.backspaceDetectionHelper();
    }
  }

  @autobind
  onKeyDown(event: SyntheticKeyboardEvent<HTMLDivElement>) {
    const firstLineData = this.getFirstLineMetadata();
    if (firstLineData) {
      const { firstLine, isOnlyLine } = firstLineData;

      // if we hit backspace on an empty formula, prevent the textarea's default
      // action of erasing the existing empty div. This avoids a weird bug where
      // cursor position gets screwed up and then the editor starts throwing an
      // error
      if (event.key === 'Backspace' && firstLine === '' && isOnlyLine) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // HACK(catherine) Holding down backspace caused some weird stuff so
      // here's a hack so you can't hold down backspace at all
      if (event.key === 'Backspace' && event.repeat === true) {
        event.preventDefault();
      }
    }
  }

  @autobind
  onMouseUp() {
    this.props.onFormulaCursorChange(this.getCursorPosition());
  }

  render(): React.Element<'div'> {
    const html = this.props.formula.getHTML('editor');
    return (
      <div
        role="textbox"
        aria-label={ARIA_NAME}
        contentEditable
        ref={this._divElt}
        className="custom-calculations-formula-editor zen-input-text"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: html }}
        onKeyDown={this.onKeyDown}
        onKeyUp={this.onKeyUp}
        onMouseUp={this.onMouseUp}
      />
    );
  }
}
