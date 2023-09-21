// @flow
import * as React from 'react';

import Dropdown from 'components/ui/Dropdown';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import InputText from 'components/ui/InputText';
import User, { USER_STATUS } from 'services/models/User';
import type { UserStatus } from 'services/models/User';

type Props = {
  email: string,
  firstName: string,
  lastName: string,
  onEmailChange: (email: string) => void,
  onFirstNameChange: (firstName: string) => void,
  onLastNameChange: (lastName: string) => void,
  onPhoneNumberChange: (phoneNumber: string) => void,
  onResendUserInvite: (existingUser: User) => Promise<User>,
  onResetPassword: (user: User) => Promise<void>,
  onStatusChange: (status: UserStatus) => void,
  phoneNumber: string,
  status: UserStatus,
  user: User,
};

export default function UserDetailsTab({
  email,
  firstName,
  lastName,
  onEmailChange,
  onFirstNameChange,
  onLastNameChange,
  onPhoneNumberChange,
  onResendUserInvite,
  onResetPassword,
  onStatusChange,
  phoneNumber,
  status,
  user,
}: Props): React.Element<typeof Group.Vertical> {
  const nameBlock = (
    <Group.Horizontal
      flex
      itemStyle={{ width: '50%' }}
      lastItemStyle={{ width: '50%' }}
      spacing="l"
    >
      <Group.Vertical spacing="xxs">
        <div className="u-label-text">{I18N.textById('firstName')}</div>
        <InputText.Uncontrolled
          debounce
          initialValue={firstName}
          onChange={onFirstNameChange}
          testId="first-name-input"
          width="100%"
        />
      </Group.Vertical>
      <Group.Vertical spacing="xxs">
        <div className="u-label-text">{I18N.textById('lastName')}</div>
        <InputText.Uncontrolled
          debounce
          initialValue={lastName}
          onChange={onLastNameChange}
          testId="last-name-input"
          width="100%"
        />
      </Group.Vertical>
    </Group.Horizontal>
  );

  const emailBlock = (
    <Group.Vertical spacing="xxs">
      <div className="u-label-text">{I18N.textById('Email')}</div>
      <InputText.Uncontrolled
        debounce
        initialValue={email}
        onChange={onEmailChange}
        testId="email-input"
      />
    </Group.Vertical>
  );

  const onResendUserInviteClick = () => {
    onResendUserInvite(user);
  };

  const activeStatus = USER_STATUS.ACTIVE;
  const inactiveStatus = USER_STATUS.INACTIVE;
  const pendingStatus = USER_STATUS.PENDING;
  const isUserPending = status === pendingStatus;

  const statusDropdown = isUserPending ? (
    <Group.Vertical>
      <Dropdown
        buttonWidth="100%"
        defaultDisplayContent={I18N.text('Pending')}
        disableSelect
        onSelectionChange={onStatusChange}
        value={status}
      >
        <Dropdown.Option key={pendingStatus} value={pendingStatus}>
          {I18N.textById('Pending')}
        </Dropdown.Option>
      </Dropdown>
      <div
        className="u-highlighted-text"
        onClick={onResendUserInviteClick}
        role="button"
      >
        {I18N.text('Resend Invite')}
      </div>
    </Group.Vertical>
  ) : (
    <Dropdown
      buttonWidth="100%"
      defaultDisplayContent={
        status === 'active'
          ? I18N.textById('Active')
          : I18N.textById('Inactive')
      }
      onSelectionChange={onStatusChange}
      value={status}
    >
      <Dropdown.Option key={activeStatus} value={activeStatus}>
        {I18N.text('Active')}
      </Dropdown.Option>
      <Dropdown.Option key={inactiveStatus} value={inactiveStatus}>
        {I18N.text('Inactive')}
      </Dropdown.Option>
    </Dropdown>
  );

  const phoneAndStatusBlock = (
    <Group.Horizontal
      flex
      itemStyle={{ width: '50%' }}
      lastItemStyle={{ width: '50%' }}
      spacing="l"
    >
      <Group.Vertical spacing="xxs">
        <div className="u-label-text">{I18N.textById('Phone Number')}</div>
        <InputText.Uncontrolled
          debounce
          initialValue={phoneNumber}
          onChange={onPhoneNumberChange}
          testId="phone-number-input"
        />
      </Group.Vertical>
      <Group.Vertical spacing="xxs">
        <div className="u-label-text">{I18N.textById('Status')}</div>
        {statusDropdown}
      </Group.Vertical>
    </Group.Horizontal>
  );

  const onResetPasswordClick = () => {
    onResetPassword(user);
  };

  const maybePasswordResetBlock = isUserPending ? null : (
    <Group.Vertical
      paddingTop="xl"
      spacing="m"
      style={{ borderTop: '1px solid #eee' }}
    >
      <Heading size={Heading.Sizes.SMALL}>{I18N.text('Password')}</Heading>
      <Group.Horizontal>
        <div className="u-info-text">
          {I18N.text("User can't remember their password?")}&nbsp;
          <span
            className="u-highlighted-text"
            onClick={onResetPasswordClick}
            role="button"
          >
            {I18N.text('Send password reset via email')}
          </span>
        </div>
      </Group.Horizontal>
    </Group.Vertical>
  );

  return (
    <Group.Vertical spacing="xl">
      <Group.Vertical spacing="m">
        <Heading size={Heading.Sizes.SMALL}>
          {I18N.textById('Profile Details')}
        </Heading>
        {nameBlock}
        {emailBlock}
        {phoneAndStatusBlock}
      </Group.Vertical>
      {maybePasswordResetBlock}
    </Group.Vertical>
  );
}
