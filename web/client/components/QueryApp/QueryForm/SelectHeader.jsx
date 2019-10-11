// @flow
import * as React from 'react';

import { noop } from 'util/util';

type Props = {
  headerLabel: string,

  onClear: () => void,
  showClearButton: boolean,
  subHeaderLabel?: string,
};

export default class SelectHeader extends React.PureComponent<Props> {
  static defaultProps = {
    onClear: noop,
    showClearButton: false,
    subHeaderLabel: undefined,
  };

  maybeRenderSubHeader() {
    const { subHeaderLabel } = this.props;
    if (subHeaderLabel) {
      return <small>{subHeaderLabel}</small>;
    }
    return null;
  }

  maybeRenderClearButton() {
    if (this.props.showClearButton) {
      return (
        <small
          className="select-field-clear-selection"
          onClick={this.props.onClear}
          role="button"
        >
          {t('clear.label')}
        </small>
      );
    }
    return null;
  }

  render() {
    return (
      <div className="control-label select-field-label">
        {this.props.headerLabel}
        {this.maybeRenderSubHeader()}
        {this.maybeRenderClearButton()}
      </div>
    );
  }
}
