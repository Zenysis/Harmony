// @flow
import * as React from 'react';

import Dropdown from 'components/ui/Dropdown';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
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

const TEXT = t('admin_app.UsersTab.UserViewModal.UserDetailsTab');

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
        <div className="u-label-text">{TEXT.firstName}</div>
        <InputText.Uncontrolled
          debounce
          initialValue={firstName}
          onChange={onFirstNameChange}
          width="100%"
          testId="first-name-input"
        />
      </Group.Vertical>
      <Group.Vertical spacing="xxs">
        <div className="u-label-text">{TEXT.lastName}</div>
        <InputText.Uncontrolled
          debounce
          initialValue={lastName}
          onChange={onLastNameChange}
          width="100%"
          testId="last-name-input"
        />
      </Group.Vertical>
    </Group.Horizontal>
  );

  const emailBlock = (
    <Group.Vertical spacing="xxs">
      <div className="u-label-text">{TEXT.email}</div>
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
        defaultDisplayContent={TEXT.pendingStatus}
        onSelectionChange={onStatusChange}
        value={status}
        buttonWidth="100%"
        disableSelect
      >
        <Dropdown.Option key={pendingStatus} value={pendingStatus}>
          {TEXT.pendingStatus}
        </Dropdown.Option>
      </Dropdown>
      <div
        className="u-highlighted-text"
        onClick={onResendUserInviteClick}
        role="button"
      >
        {TEXT.resendInviteText}
      </div>
    </Group.Vertical>
  ) : (
    <Dropdown
      defaultDisplayContent={TEXT[status]}
      onSelectionChange={onStatusChange}
      value={status}
      buttonWidth="100%"
    >
      <Dropdown.Option key={activeStatus} value={activeStatus}>
        {TEXT.activeStatus}
      </Dropdown.Option>
      <Dropdown.Option key={inactiveStatus} value={inactiveStatus}>
        {TEXT.inactiveStatus}
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
        <div className="u-label-text">{TEXT.phoneNumber}</div>
        <InputText.Uncontrolled
          debounce
          initialValue={phoneNumber}
          onChange={onPhoneNumberChange}
          testId="phone-number-input"
        />
      </Group.Vertical>
      <Group.Vertical spacing="xxs">
        <div className="u-label-text">{TEXT.status}</div>
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
      style={{ borderTop: '1px solid #eee' }}
      spacing="m"
    >
      <Heading size={Heading.Sizes.SMALL}>{TEXT.passwordHeading}</Heading>
      <Group.Horizontal>
        <div className="u-info-text">
          {TEXT.passwordStaticText}&nbsp;
          <span
            className="u-highlighted-text"
            onClick={onResetPasswordClick}
            role="button"
          >
            {TEXT.passwordButtonText}
          </span>
        </div>
      </Group.Horizontal>
    </Group.Vertical>
  );

  return (
    <Group.Vertical spacing="xl">
      <Group.Vertical spacing="m">
        <Heading size={Heading.Sizes.SMALL}>{TEXT.profileDetails}</Heading>
        {nameBlock}
        {emailBlock}
        {phoneAndStatusBlock}
      </Group.Vertical>
      {maybePasswordResetBlock}
    </Group.Vertical>
  );
}
