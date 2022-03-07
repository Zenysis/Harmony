// @flow
import * as React from 'react';

import BaseModal from 'components/ui/BaseModal';
import Button from 'components/ui/Button';
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

const TEXT = t('AdvancedQueryApp.QueryFormPanel.SharingModal');

export default class SharingModal extends React.PureComponent<Props> {
  @autobind
  onCopyButtonClick() {
    window.navigator.clipboard.writeText(this.props.url).then(() => {
      Toaster.success(TEXT.onCopySuccess);
    });
  }

  renderModalBody(): React.Element<typeof LabelWrapper> {
    const { labelString, url } = this.props;
    return (
      <LabelWrapper label={labelString}>
        <StaticSelectableTextbox text={url} />
        <div className="copy-to-clipboard-interaction">
          <Button onClick={this.onCopyButtonClick} size={Button.Sizes.SMALL}>
            {TEXT.copyButtonText}
          </Button>
        </div>
      </LabelWrapper>
    );
  }

  render(): React.Element<typeof BaseModal> {
    const { onClick, title } = this.props;
    return (
      <BaseModal
        show
        title={title}
        onRequestClose={onClick}
        showPrimaryButton={false}
        closeButtonText={TEXT.closeButtonText}
      >
        {this.renderModalBody()}
      </BaseModal>
    );
  }
}
