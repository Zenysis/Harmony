// @flow
import React from 'react';
import styled from '@emotion/styled';

import Group from 'components/ui/Group';
import Spacing from 'components/ui/Spacing';

/**
 * NOTE: (Katuula) I have note separated this into a separate file cause it has only one css property
 * But ideally once this start to grow or even if create new styled component, we should
 * move this to styles.js file in same directory as component.
 */
const StyledAuthLayout = styled(Group.Vertical)`
  width: 33%;
`;

type Props = {
  children: React$Node,
};

const AuthLayout = ({ children }: Props): React$Node => {
  return (
    <Spacing
      alignItems="center"
      flex
      paddingTop="xxl"
      style={{ flexDirection: 'column' }}
    >
      <StyledAuthLayout>{children}</StyledAuthLayout>
    </Spacing>
  );
};

export default AuthLayout;
