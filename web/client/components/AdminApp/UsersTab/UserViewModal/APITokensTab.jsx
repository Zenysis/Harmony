// @flow
import * as React from 'react';

import APIToken from 'services/models/APIToken';
import AnimateHeight from 'components/ui/AnimateHeight';
import BaseModal from 'components/ui/BaseModal';
import Button from 'components/ui/Button';
import DirectoryService from 'services/DirectoryService';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import Spacing from 'components/ui/Spacing';
import StaticSelectableTextbox from 'components/common/StaticSelectableTextbox';
import Table from 'components/ui/Table';
import Toaster from 'components/ui/Toaster';
import Well from 'components/ui/Well';
import type User from 'services/models/User';

const DATE_FORMAT = 'MMM D, YYYY';

const ACTIVE_TOKENS_HEADER = [
  {
    displayContent: I18N.text('ID'),
    id: 'tokenId',
    sortFn: Table.Sort.string(t => t.id()),
  },
  {
    displayContent: I18N.textById('Created'),
    id: 'tokenCreated',
    sortFn: Table.Sort.number(t => t.created().unix()),
  },
  {
    displayContent: '',
    id: 'tokenRevokeAction',
  },
];

const REVOKED_TOKENS_HEADER = [
  {
    displayContent: I18N.textById('ID'),
    id: 'tokenId',
    sortFn: Table.Sort.string(t => t.id()),
  },
  {
    displayContent: I18N.textById('Created'),
    id: 'tokenCreated',
    sortFn: Table.Sort.number(t => t.created().unix()),
  },
  {
    displayContent: I18N.text('Revoked'),
    id: 'tokenRevoked',
    sortFn: Table.Sort.number(t => t.revoked().unix()),
  },
];

const renderSingleTokenRow = (
  revokeToken: APIToken => void,
  apiToken: APIToken,
) => {
  return (
    <Table.Row id={apiToken.uri()}>
      <Table.Cell>{apiToken.id()}</Table.Cell>
      <Table.Cell>{apiToken.created().format(DATE_FORMAT)}</Table.Cell>
      <Table.Cell>
        <div
          className="user-view-modal__revoke-button"
          onClick={() => revokeToken(apiToken)}
          role="button"
        >
          <I18N>Revoke</I18N>
        </div>
      </Table.Cell>
    </Table.Row>
  );
};

const renderSingleRevokedTokenRow = (apiToken: APIToken) => {
  return (
    <Table.Row id={apiToken.uri()}>
      <Table.Cell>{apiToken.id()}</Table.Cell>
      <Table.Cell>{apiToken.created().format(DATE_FORMAT)}</Table.Cell>
      <Table.Cell>{apiToken.revoked().format(DATE_FORMAT)}</Table.Cell>
    </Table.Row>
  );
};

type Props = {
  apiTokens: $ReadOnlyArray<APIToken>,
  onUpdate: ($ReadOnlyArray<APIToken>) => void,
  user: User,
};

export default function APITokensTab({
  apiTokens,
  onUpdate,
  user,
}: Props): React.Element<typeof Group.Vertical> {
  const [showRevokedTokens, setShowRevokedTokens] = React.useState<boolean>(
    false,
  );

  const activeTokens = apiTokens.filter(token => !token.isRevoked());
  const revokedTokens = apiTokens.filter(token => token.isRevoked());

  const [revokingToken, setRevokingToken] = React.useState<APIToken | void>();
  const initiateRevokeToken = (token: APIToken) => {
    setRevokingToken(token);
  };
  const revokeToken = (token: APIToken) => {
    onUpdate(
      apiTokens.map(itoken =>
        itoken === token ? itoken.isRevoked(true) : itoken,
      ),
    );
    // Just for visibility where the token went, open the revoked table, if it was closed
    setShowRevokedTokens(true);
  };

  const [newToken, setNewToken] = React.useState<?string>();

  const activeTokensSection = !activeTokens.length ? (
    <Well size="large">
      <Spacing
        className="user-view-modal__well-empty u-paragraph-text"
        paddingY="xxxl"
      >
        <I18N>You don&apos;t have any API access tokens</I18N>
      </Spacing>
    </Well>
  ) : (
    <Table
      className="user-view-modal__table"
      data={activeTokens}
      headers={ACTIVE_TOKENS_HEADER}
      initialColumnSortOrder="ASC"
      initialColumnToSort="tokenCreated"
      renderRow={token => renderSingleTokenRow(initiateRevokeToken, token)}
    />
  );

  const revokedTokensSection = revokedTokens.length ? (
    <>
      <Group.Horizontal alignItems="center" flex spacing="none">
        <Icon
          onClick={() => setShowRevokedTokens(!showRevokedTokens)}
          type={showRevokedTokens ? 'svg-caret-down' : 'svg-caret-right'}
        />
        {I18N.text(
          {
            one: '1 revoked access token',
            other: '%(count)s revoked access tokens',
            zero: '',
          },
          'revokedTokensCount',
          { count: revokedTokens.length },
        )}
      </Group.Horizontal>
      <AnimateHeight height={showRevokedTokens ? 'auto' : 0}>
        <Table
          className="user-view-modal__table user-view-modal__revoked-table"
          data={revokedTokens}
          headers={REVOKED_TOKENS_HEADER}
          initialColumnSortOrder="ASC"
          initialColumnToSort="tokenCreated"
          renderRow={renderSingleRevokedTokenRow}
        />
      </AnimateHeight>
    </>
  ) : (
    undefined
  );

  return (
    <Group.Vertical spacing="m">
      <Group.Item marginBottom="none">
        <Heading size={Heading.Sizes.SMALL}>
          {I18N.text('API Access Tokens')}
        </Heading>
      </Group.Item>
      <Group.Horizontal flex justifyContent="space-between">
        <div className="u-info-text">
          <I18N>
            API access tokens are used to authenticate and authorize access to
            the Integrated Data API.
          </I18N>
        </div>
        <div
          className="user-view-modal__add-button"
          onClick={() => {
            DirectoryService.generateUserAPIToken(user)
              .then(token => {
                onUpdate([...apiTokens, token]);
                setNewToken(token.token());
              })
              .catch(() =>
                Toaster.error(
                  I18N.text('There was a problem generating a token'),
                ),
              );
          }}
          role="button"
        >
          <I18N>Generate Access Token</I18N>
        </div>
      </Group.Horizontal>
      {activeTokensSection}
      {revokedTokensSection}
      <BaseModal
        closeButtonText={I18N.textById('Cancel')}
        onPrimaryAction={() => {
          if (!revokingToken) return;
          revokeToken(revokingToken);
          setRevokingToken(undefined);
        }}
        onRequestClose={() => setRevokingToken(undefined)}
        primaryButtonText={I18N.text('Revoke Token')}
        show={!!revokingToken}
        title={I18N.textById('Revoke')}
        width={604}
      >
        <p>
          <I18N>
            When you revoke an access token, it becomes invalid and can no
            longer be used to access the API. This means that any API requests
            made using that token will fail and the user or application
            associated with the token will no longer have access to the
            API&apos;s resources.
          </I18N>
        </p>
        <p>
          <I18N>Are you sure you wish to proceed?</I18N>
        </p>
        <p>
          <I18N>
            Please note that all changes will only be saved once a user clicks
            “Save” in the main User Profile.
          </I18N>
        </p>
      </BaseModal>
      <BaseModal
        closeButtonText={I18N.textById('Done')}
        onRequestClose={() => setNewToken(undefined)}
        show={!!newToken}
        showPrimaryButton={false}
        title={I18N.text('New token generated')}
        width={604}
      >
        <p>
          <I18N>
            Be sure to copy your new token below. It won’t be shown in full
            again.
          </I18N>
        </p>
        <Group.Horizontal firstItemFlexValue="1" flex>
          <StaticSelectableTextbox text={newToken || ''} />
          <Button
            onClick={() => {
              navigator.clipboard.writeText(newToken || '');
              Toaster.success(
                I18N.text(
                  'Token has been copied to your clipboard. Do not forget to save changes before using it!',
                ),
              );
            }}
          >
            <I18N>Copy</I18N>
          </Button>
        </Group.Horizontal>
      </BaseModal>
    </Group.Vertical>
  );
}
