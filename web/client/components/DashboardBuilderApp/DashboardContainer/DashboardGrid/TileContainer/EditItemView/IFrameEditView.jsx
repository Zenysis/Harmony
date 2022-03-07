// @flow
import * as React from 'react';

import BaseModal from 'components/ui/BaseModal';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import InfoTooltip from 'components/ui/InfoTooltip';
import InputText from 'components/ui/InputText';
import type DashboardIFrameItem from 'models/DashboardBuilderApp/DashboardItem/DashboardIFrameItem';

type Props = {
  initialItem: DashboardIFrameItem,
  onRequestClose: () => void,
  onSaveClick: DashboardIFrameItem => void,
};

// NOTE(stephen): Matching the pattern construction found in the legacy IFrame
// edit view.
// NOTE(stephen): This kind of seems insecure. We should be very selective about
// what types of URLs we allow and only make the types more broad when requested
// by the user. Right now, this seems to support ftp and file.
const VALID_URL_PATTERN = new RegExp(
  // eslint-disable-next-line no-useless-escape
  /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/,
);

/**
 * An edit view that allows the user to change the title and URL used by an
 * IFrame tile.
 */
export default function IFrameEditView({
  initialItem,
  onRequestClose,
  onSaveClick,
}: Props): React.Node {
  const [currentItem, setCurrentItem] = React.useState<DashboardIFrameItem>(
    initialItem,
  );
  const onTitleChange = React.useCallback(
    title => setCurrentItem(currentItem.title(title)),
    [currentItem, setCurrentItem],
  );
  const onURLChange = React.useCallback(
    url => setCurrentItem(currentItem.iFrameURL(url)),
    [currentItem, setCurrentItem],
  );
  const onSaveIFrameItemClick = React.useCallback(() => {
    onSaveClick(currentItem);
  }, [currentItem, onSaveClick]);

  const urlIsValid = React.useMemo(() => {
    return VALID_URL_PATTERN.test(currentItem.iFrameURL());
  }, [currentItem]);

  // TODO(stephen): Translate the `invalidMessage`. The original way that the
  // URL was validated in the legacy dashboard iframe edit view was only on
  // submit. When the user pressed submit, then there would be an error Toast
  // that would pop up. Now, we are using the `invalidMessage` capability of
  // `InputText` to show the error message inline.
  return (
    <BaseModal
      disablePrimaryButton={!urlIsValid}
      onPrimaryAction={onSaveIFrameItemClick}
      onRequestClose={onRequestClose}
      show
      title={I18N.text('Edit IFrame')}
      width="80%"
    >
      <Group.Vertical spacing="m">
        <Group.Vertical spacing="s">
          <Heading.Small underlined>{I18N.text('iFrame Title')}</Heading.Small>
          <InputText onChange={onTitleChange} value={currentItem.title()} />
        </Group.Vertical>
        <div>
          <p>
            {I18N.text('Paste the URL source for the iFrame below')}
            <InfoTooltip
              text={I18N.text(
                "Please only enter the embed source URL, not the entire embed code. You will find the source URL in the embed code within quotes after 'src='.",
              )}
            />
          </p>
          <InputText
            invalid={!urlIsValid}
            invalidMessage={I18N.text('The URL entered is not valid')}
            onChange={onURLChange}
            placeholder="https://www.youtube.com/embed/jNsyPZ3zB48"
            value={currentItem.iFrameURL()}
          />
        </div>
      </Group.Vertical>
    </BaseModal>
  );
}
