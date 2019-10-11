// @flow
import * as React from 'react';

import CustomField from 'models/core/Field/CustomField';

type Props = {
  // TODO(catherine): Once fully hooked up to CustomFieldPanel,
  // CustomField prop will not be optional
  field: CustomField | void,
  maxWidth: number,
  maxHeight: number,
};

export default class PrettyFormulaViewer extends React.PureComponent<Props> {
  _mainDivElt: $RefObject<'div'> = React.createRef();

  componentDidMount() {
    this.setMainDivHTML();
  }

  componentDidUpdate() {
    this.setMainDivHTML();
  }

  // TODO(pablo): we have to set the contents as a literal HTML string
  // because the FormulaMetadata model only tracks the lines as pure strings,
  // so we have to convert them to HTML to then render the tags. Ideally the
  // model should store more information about the placement of tags so that
  // we can convert the lines directly to React components instead of
  // converting to HTML.

  setMainDivHTML() {
    if (this.props.field) {
      const { formula } = this.props.field.modelValues();
      const { metadata } = formula.modelValues();
      const html = metadata.getHTML('viewer');

      if (this._mainDivElt.current !== null) {
        this._mainDivElt.current.innerHTML = html;
      }
    }
  }

  render() {
    const backgroundStyle = {
      width: this.props.maxWidth,
      height: this.props.maxHeight,
    };

    return (
      <div
        ref={this._mainDivElt}
        className="custom-calculations-formula-viewer__background"
        style={backgroundStyle}
      />
    );
  }
}
