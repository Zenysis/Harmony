// @flow
import * as React from 'react';

import FullButton from 'components/ui/DatePicker/internal/FullButton';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import LegacyButton from 'components/ui/LegacyButton';
import { noop } from 'util/util';
import type { StyleObject } from 'types/jsCore';

type DefaultProps = {
  onApplyClick: () => void,
  showApplyButton: boolean,
  width?: number | string,
};

type Props = {
  ...DefaultProps,
  children: React.Node,
  onCloseClick: () => void,
};

export default class CustomizationModuleWrapper extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    onApplyClick: noop,
    showApplyButton: false,
    width: undefined,
  };

  _customizationModuleWrapperRef: $ElementRefObject<'div'> = React.createRef();

  getStyle(): StyleObject {
    return {
      width: this.props.width,
    };
  }

  renderFooter(): React.Node {
    const { onApplyClick, onCloseClick, showApplyButton } = this.props;
    if (showApplyButton) {
      return (
        <FullButton
          ariaName={I18N.textById('Apply')}
          className="aqt-customization-module-wrapper__apply-btn"
          onClick={onApplyClick}
        >
          <Heading.Small whiteText>{I18N.textById('Apply')}</Heading.Small>
        </FullButton>
      );
    }

    return (
      <div className="aqt-customization-module-wrapper__close-row">
        <LegacyButton
          className="aqt-customization-module-wrapper__action-btn"
          onClick={onCloseClick}
        >
          {I18N.textById('Close')}
        </LegacyButton>
      </div>
    );
  }

  render(): React.Node {
    return (
      <div
        ref={this._customizationModuleWrapperRef}
        className="aqt-customization-module-wrapper"
        style={this.getStyle()}
      >
        <div className="aqt-customization-module-wrapper__contents">
          {this.props.children}
        </div>
        {this.renderFooter()}
      </div>
    );
  }
}
