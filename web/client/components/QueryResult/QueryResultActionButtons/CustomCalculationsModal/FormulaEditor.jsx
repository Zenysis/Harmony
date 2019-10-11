// @flow
import * as React from 'react';
import Promise from 'bluebird';
import ReactDOM from 'react-dom';

import CursorPosition from 'models/QueryResult/QueryResultActionButtons/CustomCalculationsModal/CursorPosition';
import FormulaCursor from 'models/QueryResult/QueryResultActionButtons/CustomCalculationsModal/FormulaCursor';
import FormulaMetadata from 'models/core/Field/CustomField/Formula/FormulaMetadata';
import Tag from 'components/ui/Tag';
import ZenArray from 'util/ZenModel/ZenArray';
import ZenMap from 'util/ZenModel/ZenMap';
import autobind from 'decorators/autobind';
import memoizeOne from 'decorators/memoizeOne';
import { setCursorInDOM } from 'components/QueryResult/QueryResultActionButtons/CustomCalculationsModal/cursorUtil';
import type Field from 'models/core/Field';

type Props = {
  // cursor is a controlled prop, rather than uncontrolled, because when new
  // fields are added or removed, the cursor has to also change. Field changes
  // are controlled by parent components, so the cursor is as well.
  cursor: FormulaCursor,
  formula: FormulaMetadata,
  onFormulaChange: (formula: FormulaMetadata) => void,
  onFormulaCursorChange: (cursor: FormulaCursor) => void,
  onRemoveFieldClick: ({
    field: Field,
    lineNumber: number,
    startIndex: number,
    endIndex: number,
  }) => void,
};

type TagData = {
  field: Field,
  lineNumber: number,
  startIndex: number,
  endIndex: number,
};

// Props to ignore when determining if we should re-render
// cursor is important to track, but its change doesn't need to re-render
// the DOM
const PROPS_TO_IGNORE = new Set(['cursor']);

export default class FormulaEditor extends React.Component<Props> {
  _divElt: $RefObject<'div'> = React.createRef();

  shouldComponentUpdate(nextProps: Props) {
    return Object.keys(nextProps).some(
      propName =>
        !PROPS_TO_IGNORE.has(propName) &&
        this.props[propName] !== nextProps[propName],
    );
  }

  componentDidUpdate() {
    if (this._divElt.current) {
      const renderPromises = $(this._divElt.current)
        .find('.custom-calculations-formula-editor__field-tag')
        .map((i, el) => {
          if (el instanceof HTMLElement) {
            return new Promise(resolve => {
              ReactDOM.render(this.getFieldTag(el), el, resolve);
            });
          }
          return undefined;
        })
        .toArray();
      Promise.all(renderPromises).then(() => {
        if (this._divElt.current) {
          setCursorInDOM(this._divElt.current, this.props.cursor);
        }
      });
    }
  }

  @memoizeOne
  _getFieldsMapHelper(fields: ZenArray<Field>): ZenMap<Field> {
    return ZenMap.fromArray(fields, 'id');
  }

  getFieldsMap() {
    return this._getFieldsMapHelper(this.props.formula.fields());
  }

  getFieldTag(placeholderElement: HTMLElement) {
    const el = $(placeholderElement)[0];
    const { fieldId } = el.dataset;

    const field = this.getFieldsMap().get(fieldId, undefined);
    if (!field) {
      throw new Error(
        `[FormulaEditor] Something went wrong and could not find field ${fieldId}`,
      );
    }

    const lineNumber = Number(el.dataset.lineNumber);
    const valueObj = {
      field,
      lineNumber,
      startIndex: Number(el.dataset.startIndex),
      endIndex: Number(el.dataset.endIndex),
    };

    return (
      <Tag
        value={valueObj}
        removable
        onRequestRemove={this.props.onRemoveFieldClick}
        size={Tag.Sizes.SMALL}
      >
        {field.label()}
      </Tag>
    );
  }

  getFirstLineMetadata(): { firstLine: string, isOnlyLine: boolean } | void {
    if (this._divElt.current) {
      const $divChildren = $(this._divElt.current).children('div');
      if ($divChildren.length === 0) {
        return { firstLine: '', isOnlyLine: true };
      }

      const $firstLine = $divChildren.first();
      const $nestedLines = $firstLine.find(
        '.custom-calculations-formula-editor__line',
      );
      const firstLine =
        $nestedLines.length === 0
          ? $firstLine[0].textContent
          : $nestedLines[0].textContent;
      const isOnlyLine = $divChildren.length === 1 && $nestedLines.length <= 1;

      return { firstLine, isOnlyLine };
    }
    return undefined;
  }

  getFormulaLines(): Array<string> {
    const lines = [];
    if (this._divElt.current) {
      $(this._divElt.current)
        .children('div')
        .each((i, child) => {
          // if text was added through copy/paste, we might have nested lines
          // within a single line
          const nestedLines = $(child).find(
            '.custom-calculations-formula-editor__line',
          );
          if (nestedLines.length > 0) {
            nestedLines.each((_, line) => lines.push(line.textContent));
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
        const $line = $(rangeContainer).closest('div[data-id="formula-line"]');
        const lineNumber = $line.index();

        // Set our cloned range to select the entire line
        rangeClone.selectNodeContents($line[0]);

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
  parseTagData(tagNode: HTMLElement): TagData {
    return {
      field: this.getFieldsMap().forceGet(tagNode.dataset.fieldId),
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
    const newFormula = formula.lines(ZenArray.create(this.getFormulaLines()));
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

  render() {
    const html = this.props.formula.getHTML('editor');
    return (
      <div
        role="textbox"
        contentEditable
        ref={this._divElt}
        className="form-control custom-calculations-formula-editor"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: html }}
        onKeyDown={this.onKeyDown}
        onKeyUp={this.onKeyUp}
        onMouseUp={this.onMouseUp}
      />
    );
  }
}
