// @flow
import React from 'react';

import AuthenticationService from 'services/AuthenticationService';
import I18N from 'lib/I18N';
import ProgressBar from 'components/ui/ProgressBar';
import Spacing from 'components/ui/Spacing';
import useBoolean from 'lib/hooks/useBoolean';
import type { UserManagerInfo } from 'services/AuthenticationService';

type Props = {
  children: React$Node,
};

export const UserManagerContext: React$Context<void | UserManagerInfo> = React.createContext();

export default function UserManagerProvider({ children }: Props): React$Node {
  const [
    userManagerInfo,
    setUserManagerInfo,
  ] = React.useState<UserManagerInfo | void>();

  const [isRequestFailed, requestFailed] = useBoolean(false);

  React.useEffect(() => {
    AuthenticationService.userManagerInfo()
      .then(setUserManagerInfo)
      .catch(requestFailed);
  }, [requestFailed]);

  if (isRequestFailed) {
    return (
      <Spacing>
        <p>
          <I18N>Something went wrong</I18N>
        </p>
      </Spacing>
    );
  }

  return userManagerInfo ? (
    <UserManagerContext.Provider value={userManagerInfo}>
      {children}
    </UserManagerContext.Provider>
  ) : (
    <Spacing>
      <ProgressBar />
    </Spacing>
  );
}
