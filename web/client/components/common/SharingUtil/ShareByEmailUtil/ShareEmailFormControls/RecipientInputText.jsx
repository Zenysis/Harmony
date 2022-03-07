// @flow
import * as React from 'react';
import type Promise from 'bluebird';

import DirectoryService from 'services/DirectoryService';
import Dropdown from 'components/ui/Dropdown';
import GraphSearchResults from 'models/ui/common/GraphSearchResults';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import InfoTooltip from 'components/ui/InfoTooltip/index';
import LabelWrapper from 'components/ui/LabelWrapper';
import Popover from 'components/ui/Popover';
import SecurityGroup from 'services/models/SecurityGroup';
import Tag from 'components/ui/Tag';
import TagsInputText from 'components/common/SharingUtil/ShareByEmailUtil/ShareEmailFormControls/TagInputText';
import Toaster from 'components/ui/Toaster';
import Tooltip from 'components/ui/Tooltip';
import autobind from 'decorators/autobind';
import { noop } from 'util/util';

const TEXT = t('query_result.common.share_analysis');
const EMPTY_SET = new Set([]);
const EMPTY_ARRAY = [];
const SEARCH_RESULTS = new GraphSearchResults<string, string>();
const EMAIL_PATTERN = '(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$)';
const EMAIL_REGEX = RegExp(EMAIL_PATTERN);

type DefaultProps = {
  getUserEmails: () => Promise<$ReadOnlyArray<string>>,
  getGroups: () => Promise<$ReadOnlyArray<SecurityGroup>>,
  allowExternalUsers: boolean,
};

type Props = {
  ...DefaultProps,
  setRecipients: (
    recipients: $ReadOnlyArray<string>,
    externalRecipients: $ReadOnlyArray<string>,
  ) => void,
  onUserGroupChange: (groups: $ReadOnlyArray<SecurityGroup>) => void,
  recipients: $ReadOnlyArray<string>,
  selectedGroups: $ReadOnlyArray<string>,
};

type State = {
  showDropdown: boolean,
  filteredUserRecipients: $ReadOnlyArray<string>,
  userEmailSet: Set<string>,
  textValue: string,
  groupsSet: Set<string>,
  userGroups: $ReadOnlyArray<SecurityGroup>,
};

export default class RecipientInputText extends React.PureComponent<
  Props,
  State,
> {
  state: State = {
    showDropdown: false,
    filteredUserRecipients: [],
    userEmailSet: EMPTY_SET,
    textValue: '',
    groupsSet: EMPTY_SET,
    userGroups: [],
  };

  _tagInputRef: $ElementRefObject<'input'> = React.createRef();

  static defaultProps: DefaultProps = {
    getUserEmails: () =>
      DirectoryService.getUsers().then(users =>
        users.map<string>(user => user.username()),
      ),
    allowExternalUsers: true,
    getGroups: DirectoryService.getGroups,
  };

  componentDidMount(): void {
    // Get all users
    this.props.getUserEmails().then(userEmails => {
      const userEmailSet = new Set(userEmails);
      this.setState({ userEmailSet });
    });

    // Get all groups
    this.props.getGroups().then(groups =>
      this.setState({
        groupsSet: new Set(groups.map(group => group.name())),
        userGroups: groups,
      }),
    );
  }

  getExternalRecipients(
    recipients: $ReadOnlyArray<string>,
  ): $ReadOnlyArray<string> {
    const { userEmailSet } = this.state;
    const externalRecipients = recipients.filter(
      userEmail => !userEmailSet.has(userEmail),
    );
    return externalRecipients;
  }

  @autobind
  focusTagInputText() {
    if (this._tagInputRef.current) {
      this._tagInputRef.current.focus();
    }
  }

  @autobind
  getSecurityGroups(
    groupNames: $ReadOnlyArray<string>,
  ): $ReadOnlyArray<SecurityGroup> {
    const { userGroups } = this.state;
    const newSelectedGroups = [];
    groupNames.forEach(name => {
      const userGroup = userGroups.find(group => group.name() === name);
      if (userGroup) {
        newSelectedGroups.push(userGroup);
      }
    });
    return newSelectedGroups;
  }

  @autobind
  onTextChange(searchTerm: string) {
    this.setState(prevState => {
      const filteredUserRecipients = [
        ...prevState.userEmailSet,
        ...prevState.groupsSet,
      ].filter(
        email =>
          searchTerm.length !== 0 &&
          email.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      return {
        filteredUserRecipients,
        showDropdown: filteredUserRecipients.length !== 0,
        textValue: searchTerm,
      };
    });
  }

  @autobind
  onTagRemove(tagValue: string) {
    const { recipients, setRecipients, selectedGroups } = this.props;
    const { groupsSet } = this.state;
    if (groupsSet.has(tagValue)) {
      const newGroups = selectedGroups.filter(name => name !== tagValue);
      this.props.onUserGroupChange(this.getSecurityGroups(newGroups));
    } else {
      const email = tagValue.toLowerCase();
      const newRecipients = recipients.filter(value => value !== email);
      const externalRecipients = this.getExternalRecipients(newRecipients);
      setRecipients(newRecipients, externalRecipients);
    }

    this.focusTagInputText();
  }

  @autobind
  onRequestClose() {
    this.setState(prevState => ({ showDropdown: !prevState.showDropdown }));
  }

  @autobind
  onAddEmail(email: string) {
    const { userEmailSet } = this.state;
    const { recipients, allowExternalUsers } = this.props;
    if (recipients.includes(email)) {
      Toaster.error(`${email} ${TEXT.errors.addedEmail}`);
      return;
    }

    if (!allowExternalUsers && !userEmailSet.has(email)) {
      Toaster.error(`${email} ${TEXT.errors.notPlatformEmail}`);
      return;
    }

    const newRecipients = [...this.props.recipients, email];
    const externalRecipients = this.getExternalRecipients(newRecipients);
    this.props.setRecipients(newRecipients, externalRecipients);
  }

  @autobind
  onAddGroup(name: string) {
    const { userGroups } = this.state;
    const group = userGroups.find(grp => grp.name() === name);
    if (group) {
      if (!group.users().size()) {
        Toaster.error(
          I18N.text('Selected group "%(name)s" has no members', { name }),
        );
        return;
      }
    }
    const groups = this.getSecurityGroups([...this.props.selectedGroups, name]);
    this.props.onUserGroupChange(groups);
  }

  @autobind
  onTagAdd(value: string) {
    const { groupsSet } = this.state;

    if (!groupsSet.has(value) && !EMAIL_REGEX.test(value)) {
      Toaster.error(
        I18N.text(
          '"%(value)s" is not a valid email address or user group name',
          {
            value,
          },
        ),
      );
      return;
    }

    if (groupsSet.has(value)) {
      this.onAddGroup(value);
    } else {
      this.onAddEmail(value.toLowerCase());
    }

    this.setState({
      textValue: '',
      filteredUserRecipients: [],
      showDropdown: false,
    });
    this.focusTagInputText();
  }

  maybeRenderGroupIcon(recipient: string): React.Node {
    const { groupsSet } = this.state;
    if (groupsSet.has(recipient)) {
      return (
        <Icon
          className="recipient-input-search-results-popover__group-icon"
          type="user"
        />
      );
    }
    return null;
  }

  maybeRenderEmailsDropdown(): React.Node {
    const { filteredUserRecipients, showDropdown } = this.state;

    // we add an `onMouseDown` event to each option with a `preventDefault`
    // call to avoid the Blur event on the input textbox from triggering due
    // to a mousedown on this option
    const optionItems = filteredUserRecipients.map(recipient => (
      <Dropdown.Option key={recipient} value={recipient}>
        <div role="button" onMouseDown={e => e.preventDefault()}>
          {recipient} {this.maybeRenderGroupIcon(recipient)}
        </div>
      </Dropdown.Option>
    ));

    return (
      <Popover
        anchorElt="recipient_popover_anchor_elt"
        anchorOuterSpacing={0}
        className="recipient-input-search-results-popover"
        isOpen={showDropdown}
        onRequestClose={this.onRequestClose}
        anchorOrigin={Popover.Origins.BOTTOM_LEFT}
        offsetX={120}
      >
        <div className="recipient-input-search-results-popover__options-list">
          <Dropdown.OptionsList
            allChildrenSelected={false}
            displayCurrentSelection
            emptyOptionsGroupContent={TEXT.noUsersPlaceholder}
            marginPerLevel=""
            multiselect={false}
            noOptionsContent={TEXT.noUsersPlaceholder}
            onOptionsGroupClick={noop}
            onOptionClick={this.onTagAdd}
            openGroups={EMPTY_SET}
            useSearch={false}
            searchText=""
            searchResults={SEARCH_RESULTS}
            selectedValues={EMPTY_ARRAY}
          >
            {optionItems}
          </Dropdown.OptionsList>
        </div>
      </Popover>
    );
  }

  renderEmailTags(): $ReadOnlyArray<React.Element<typeof Tag>> {
    const { userEmailSet, groupsSet } = this.state;
    const { recipients, selectedGroups } = this.props;
    const emailTags = [...recipients, ...selectedGroups].map(recipient => {
      const isUser = userEmailSet.has(recipient);
      const isGroup = groupsSet.has(recipient);

      const intent =
        isUser || isGroup ? Tag.Intents.PRIMARY : Tag.Intents.WARNING;

      const tagContent =
        isUser || isGroup ? (
          recipient
        ) : (
          <Tooltip content={TEXT.externalUser} tooltipPlacement="top">
            {recipient}
          </Tooltip>
        );

      return (
        <Tag
          className="email-recipient-tag"
          intent={intent}
          key={recipient}
          onRequestRemove={this.onTagRemove}
          removable
          size={Tag.Sizes.SMALL}
          value={recipient}
        >
          {tagContent}
        </Tag>
      );
    });
    return emailTags;
  }

  render(): React.Node {
    const label = (
      <React.Fragment>
        {TEXT.sendTo}{' '}
        <InfoTooltip
          text={I18N.text(
            "Enter a user group name or recipient's email address",
          )}
        />
      </React.Fragment>
    );
    return (
      <div>
        <LabelWrapper label={label}>
          <TagsInputText
            id="recipient_popover_anchor_elt"
            tagInputRef={this._tagInputRef}
            onTagAdd={this.onTagAdd}
            tags={this.renderEmailTags()}
            onTextChange={this.onTextChange}
            value={this.state.textValue}
          />
        </LabelWrapper>
        {this.maybeRenderEmailsDropdown()}
      </div>
    );
  }
}
