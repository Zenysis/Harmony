// @flow
import * as React from 'react';

import CustomField from 'models/core/Field/CustomField';

type Props = {
  field: CustomField,
  maxWidth: number,
  maxHeight: number,
};

export default class PrettyFormulaViewer extends React.PureComponent<Props> {
  _mainDivElt: $ElementRefObject<'div'> = React.createRef();

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
    const { formula } = this.props.field.modelValues();
    const { metadata } = formula.modelValues();
    const html = metadata.getHTML('viewer');

    if (this._mainDivElt.current) {
      this._mainDivElt.current.innerHTML = html;
    }
  }

  render(): React.Element<'div'> {
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
