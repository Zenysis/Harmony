// @flow
import * as React from 'react';

import Button from 'components/ui/Button';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import LabelWrapper from 'components/ui/LabelWrapper';
import {
  VALIDATION_ERROR,
  VALIDATION_SUCCESS,
  VALIDATION_WARNING,
} from 'models/AdminApp/types';

type Props = {
  dataCatalogChangesSummary: React.Node,
  onDownloadConflictsSummary?: () => void,
  resultType: string,
  showFileInput?: () => void,
  title: React.Node,
  validationMessage: React.Node,
};

export default function FileValidationSuccess({
  dataCatalogChangesSummary,
  onDownloadConflictsSummary,
  resultType,
  showFileInput,
  title,
  validationMessage,
}: Props): React.Node {
  if (!showFileInput || !onDownloadConflictsSummary) {
    return null;
  }

  const getIconType = resType => {
    switch (resType) {
      case VALIDATION_WARNING:
      case VALIDATION_ERROR:
        return 'svg-error-outline';
      default:
        return 'svg-check-circle-outline';
    }
  };

  const iconType = getIconType(resultType);

  if (resultType === VALIDATION_ERROR) {
    return (
      <Group.Horizontal
        className={`file-validation__${resultType}-box`}
        flex
        padding="l"
        spacing="xs"
      >
        <Icon
          className={`file-validation__icon file-validation__icon--${resultType}`}
          type={iconType}
        />
        <Group.Vertical spacing="l">
          <Heading.Large>{title}</Heading.Large>
          <Group.Vertical
            firstItemClassName="file-validation__subheader"
            spacing="m"
          >
            {validationMessage}
          </Group.Vertical>
          <Button onClick={showFileInput}>
            <I18N.Ref id="Try again" />
          </Button>
        </Group.Vertical>
      </Group.Horizontal>
    );
  }

  return (
    <Group.Vertical
      className={`file-validation__${resultType}-box`}
      padding="l"
      spacing="xs"
    >
      <Group.Horizontal
        alignItems="center"
        firstItemClassName={`file-validation__${resultType}-box-check`}
        flex
        itemFlexValue="initial"
        lastItemFlexValue="0 0 25%"
        lastItemStyle={{ marginLeft: 'auto' }}
      >
        <LabelWrapper
          className="file-validation__label-wrapper"
          inline
          label=""
          labelAfter
          labelClassName="file-validation__validated-label u-info-text"
        >
          <Icon
            className={`file-validation__icon file-validation__icon--${resultType}`}
            type={iconType}
          />
        </LabelWrapper>

        <Heading.Large>{title}</Heading.Large>

        <Button
          className={`file-validation__${resultType}-box-button`}
          minimal
          onClick={showFileInput}
          size="medium"
        >
          <LabelWrapper
            boldLabel
            className="file-validation__label-wrapper"
            contentClassName="u-info-text"
            inline
            label={I18N.textById('Replace File')}
            labelAfter
          >
            <Icon type="svg-refresh" />
          </LabelWrapper>
        </Button>
      </Group.Horizontal>

      {validationMessage}
      {dataCatalogChangesSummary}

      {resultType === VALIDATION_SUCCESS && (
        <I18N>
          After clicking `Complete Upload`, the new setup will be applied.
        </I18N>
      )}

      {resultType === VALIDATION_WARNING && (
        <Group.Vertical spacing="m">
          <I18N>
            Before continuing with this import, we highly recommend that you
            review the conflicts. You can review these conflicts by downloading
            a summary below. If there are conflitcs that should not be
            overwritten (e.g. new calculated indicators), we recommend that you
            recreate these first before overwriting the active setup.
          </I18N>

          <Button onClick={onDownloadConflictsSummary}>
            <I18N>Download Conflict Report</I18N>
          </Button>
        </Group.Vertical>
      )}
    </Group.Vertical>
  );
}
