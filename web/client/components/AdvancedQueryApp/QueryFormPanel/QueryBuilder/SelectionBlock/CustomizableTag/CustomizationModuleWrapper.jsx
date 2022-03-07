// @flow
import * as React from 'react';

import FullButton from 'components/ui/DatePicker/internal/FullButton';
import Heading from 'components/ui/Heading';
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

const TEXT = t(
  'AdvancedQueryApp.QueryFormPanel.QueryBuilder.SelectionBlock.CustomizableTag.CustomizationModuleWrapper',
);

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
    const { showApplyButton, onApplyClick, onCloseClick } = this.props;
    if (showApplyButton) {
      return (
        <FullButton
          ariaName={TEXT.apply}
          className="aqt-customization-module-wrapper__apply-btn"
          onClick={onApplyClick}
        >
          <Heading.Small whiteText>{TEXT.apply}</Heading.Small>
        </FullButton>
      );
    }

    return (
      <div className="aqt-customization-module-wrapper__close-row">
        <LegacyButton
          className="aqt-customization-module-wrapper__action-btn"
          onClick={onCloseClick}
        >
          {TEXT.close}
        </LegacyButton>
      </div>
    );
  }

  render(): React.Node {
    return (
      <div
        ref={this._customizationModuleWrapperRef}
        style={this.getStyle()}
        className="aqt-customization-module-wrapper"
      >
        <div className="aqt-customization-module-wrapper__contents">
          {this.props.children}
        </div>
        {this.renderFooter()}
      </div>
    );
  }
}
