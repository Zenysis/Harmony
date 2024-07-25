// @flow
import * as React from 'react';

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

const EMPTY_SET = new Set([]);
const EMPTY_ARRAY = [];
const SEARCH_RESULTS = new GraphSearchResults<string, string>();
const EMAIL_PATTERN = '(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$)';
const EMAIL_REGEX = RegExp(EMAIL_PATTERN);

type DefaultProps = {
  allowExternalUsers: boolean,
};

type Props = {
  ...DefaultProps,
  onUserGroupChange: (groups: $ReadOnlyArray<SecurityGroup>) => void,
  recipients: $ReadOnlyArray<string>,
  selectedGroups: $ReadOnlyArray<string>,
  setRecipients: (
    recipients: $ReadOnlyArray<string>,
    externalRecipients: $ReadOnlyArray<string>,
  ) => void,
};

type State = {
  filteredUserRecipients: $ReadOnlyArray<string>,
  groupsSet: Set<string>,
  showDropdown: boolean,
  textValue: string,
  userEmailSet: Set<string>,
  userGroups: $ReadOnlyArray<SecurityGroup>,
};

export default class RecipientInputText extends React.PureComponent<
  Props,
  State,
> {
  state: State = {
    filteredUserRecipients: [],
    groupsSet: EMPTY_SET,
    showDropdown: false,
    textValue: '',
    userEmailSet: EMPTY_SET,
    userGroups: [],
  };

  _tagInputRef: $ElementRefObject<'input'> = React.createRef();

  static defaultProps: DefaultProps = {
    allowExternalUsers: true,
  };

  componentDidMount(): void {
    // Get all users
    DirectoryService.getUsers().then(users => {
      this.setState({
        userEmailSet: new Set(users.map(user => user.username())),
      });
    });

    // Get all groups
    DirectoryService.getGroups().then(groups =>
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
    const { recipients, selectedGroups, setRecipients } = this.props;
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
    const { allowExternalUsers, recipients } = this.props;
    if (recipients.includes(email)) {
      Toaster.error(
        `${email} ${I18N.text(
          'has already been added. Please enter a different email address.',
        )}`,
      );
      return;
    }

    if (!allowExternalUsers && !userEmailSet.has(email)) {
      Toaster.error(
        `${email} ${I18N.text(
          'email does not belong to a user on this platform.',
        )}`,
      );
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
      filteredUserRecipients: [],
      showDropdown: false,
      textValue: '',
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
        <div onMouseDown={e => e.preventDefault()} role="button">
          {recipient} {this.maybeRenderGroupIcon(recipient)}
        </div>
      </Dropdown.Option>
    ));

    return (
      <Popover
        anchorElt="recipient_popover_anchor_elt"
        anchorOrigin={Popover.Origins.BOTTOM_LEFT}
        anchorOuterSpacing={0}
        className="recipient-input-search-results-popover"
        isOpen={showDropdown}
        offsetX={120}
        onRequestClose={this.onRequestClose}
      >
        <div className="recipient-input-search-results-popover__options-list">
          <Dropdown.OptionsList
            allChildrenSelected={false}
            displayCurrentSelection
            emptyOptionsGroupContent={I18N.text(
              'No users matching this email in the directory list.',
              'noUsersPlaceholder',
            )}
            marginPerLevel=""
            multiselect={false}
            noOptionsContent={I18N.textById('noUsersPlaceholder')}
            onOptionClick={this.onTagAdd}
            onOptionsGroupClick={noop}
            openGroups={EMPTY_SET}
            searchResults={SEARCH_RESULTS}
            searchText=""
            selectedValues={EMPTY_ARRAY}
            useSearch={false}
          >
            {optionItems}
          </Dropdown.OptionsList>
        </div>
      </Popover>
    );
  }

  renderEmailTags(): $ReadOnlyArray<React.Element<typeof Tag>> {
    const { groupsSet, userEmailSet } = this.state;
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
          <Tooltip content={I18N.text('External user')} tooltipPlacement="top">
            {recipient}
          </Tooltip>
        );

      return (
        <Tag
          key={recipient}
          className="email-recipient-tag"
          intent={intent}
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
        {I18N.text('To:')}{' '}
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
            onTagAdd={this.onTagAdd}
            onTextChange={this.onTextChange}
            tagInputRef={this._tagInputRef}
            tags={this.renderEmailTags()}
            value={this.state.textValue}
          />
        </LabelWrapper>
        {this.maybeRenderEmailsDropdown()}
      </div>
    );
  }
}
