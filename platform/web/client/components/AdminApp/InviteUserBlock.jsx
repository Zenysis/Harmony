// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import Button from 'components/ui/Button';
import DirectoryService from 'services/DirectoryService';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import InputText from 'components/ui/InputText';
import Toaster from 'components/ui/Toaster';
import User from 'services/models/User';
import useBoolean from 'lib/hooks/useBoolean';
import { cancelPromise } from 'util/promiseUtil';
import type { InviteeRequest } from 'services/DirectoryService';

const NAME_PATTERN = "(^[A-zÀ-ÿ0-9]+[A-zÀ-ÿ0-9-_.' ]*[A-zÀ-ÿ0-9]+)$";
const NAME_REGEX = RegExp(NAME_PATTERN);

const EMAIL_PATTERN = '(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$)';
const EMAIL_REGEX = RegExp(EMAIL_PATTERN);

type Props = {
  allUsers: Zen.Array<User>,
  onRefreshUsers: () => void,
};

export default function InviteUserBlock({
  allUsers,
  onRefreshUsers,
}: Props): React.Node {
  const [inputEmailValue, setInputEmailValue] = React.useState<string>('');
  const [inputNameValue, setInputNameValue] = React.useState<string>('');
  const [isSendingEmails, startSendingEmails, endSendingEmails] = useBoolean(
    false,
  );

  // When a user hits the 'Invite User' button (i.e. starts "sending [invitation] emails"),
  // isSendingEmails is toggled false -> true. When this occurs, construct an InviteeRequest
  // and use DirectoryService.inviteUser to actually send that request.
  // The inviteUser promise is cancelled when the effect concludes.
  React.useEffect(() => {
    let userPromise;
    if (isSendingEmails) {
      const invitee: InviteeRequest = {
        email: inputEmailValue.trim(),
        name: inputNameValue.trim(),
      };

      userPromise = DirectoryService.inviteUser(invitee)
        .then(() => {
          onRefreshUsers();
          Toaster.success(I18N.text('Successfully invited user.'));
        })
        .catch(error => {
          const userAlreadyExists =
            allUsers !== undefined
              ? allUsers.some(user => user.username() === invitee.email)
              : false;
          const errorMsg = userAlreadyExists
            ? I18N.text('Could not invite user because user already exists.')
            : I18N.text('Could not invite user.');

          Toaster.error(errorMsg);

          // eslint-disable-next-line no-console
          console.error(error);
        })
        .finally(() => {
          endSendingEmails();
          setInputEmailValue('');
          setInputNameValue('');
        });
    }
    return () => {
      if (userPromise !== undefined) {
        cancelPromise(userPromise);
      }
    };
    // NOTE: isSendingEmails is the only dependency for this hook
    // because inviteUser should only execute after isSendingEmails is toggled false -> true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSendingEmails]);

  const inviteButtonText = isSendingEmails
    ? I18N.text('Sending...')
    : I18N.text('Invite User');

  const inputsAreValid =
    NAME_REGEX.test(inputNameValue.trim()) &&
    EMAIL_REGEX.test(inputEmailValue.trim());

  const inviteButtonDisabled = isSendingEmails || !inputsAreValid;

  return (
    <Group.Horizontal lastItemStyle={{ marginLeft: 4 }} spacing="xs">
      <InputText
        onChange={setInputNameValue}
        onEnterPress={startSendingEmails}
        placeholder={I18N.text('Enter name')}
        value={inputNameValue}
        width="auto"
      />
      <InputText
        onChange={setInputEmailValue}
        onEnterPress={startSendingEmails}
        placeholder={I18N.text('Enter email')}
        type="email"
        value={inputEmailValue}
        width="auto"
      />
      <Button disabled={inviteButtonDisabled} onClick={startSendingEmails}>
        {inviteButtonText}
      </Button>
    </Group.Horizontal>
  );
}
