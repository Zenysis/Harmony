// @flow
import * as React from 'react';

import BaseModal from 'components/ui/BaseModal';
import Button from 'components/ui/Button';
import I18N from 'lib/I18N';
import LabelWrapper from 'components/ui/LabelWrapper';
import StaticSelectableTextbox from 'components/common/StaticSelectableTextbox';
import Toaster from 'components/ui/Toaster';
import autobind from 'decorators/autobind';

type Props = {
  labelString: string,
  onClick: () => void,
  title: string,
  url: string,
};

export default class SharingModal extends React.PureComponent<Props> {
  @autobind
  onCopyButtonClick() {
    window.navigator.clipboard.writeText(this.props.url).then(() => {
      Toaster.success(I18N.text('Successfully copied'));
    });
  }

  renderModalBody(): React.Element<typeof LabelWrapper> {
    const { labelString, url } = this.props;
    return (
      <LabelWrapper label={labelString}>
        <StaticSelectableTextbox text={url} />
        <div className="copy-to-clipboard-interaction">
          <Button onClick={this.onCopyButtonClick} size={Button.Sizes.SMALL}>
            <I18N>Copy to clipboard</I18N>
          </Button>
        </div>
      </LabelWrapper>
    );
  }

  render(): React.Element<typeof BaseModal> {
    const { onClick, title } = this.props;
    return (
      <BaseModal
        closeButtonText={I18N.textById('Close')}
        onRequestClose={onClick}
        show
        showPrimaryButton={false}
        title={title}
      >
        {this.renderModalBody()}
      </BaseModal>
    );
  }
}
