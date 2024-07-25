// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import Checkbox from 'components/ui/Checkbox';
import FullButton from 'components/ui/DatePicker/internal/FullButton';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import Popover from 'components/ui/Popover';
import Tooltip from 'components/ui/Tooltip';
import autobind from 'decorators/autobind';

type Props = {
  className: string,
  dashboardQueryItemTitles: {
    +[tileId: string]: string,
  },
  header: string,
  initialExcludedItems: Zen.Array<string>,
  onExcludedItemsUpdate: (excludedItemIds: Zen.Array<string>) => void,
  showExclusionsAsTooltip: boolean,
};

type State = {
  excludedItemIds: Zen.Array<string>,
  settingsButtonElt: HTMLSpanElement | void,
  showExcludedItemsPopover: boolean,
};

export default class ExclusionSettingsButton extends React.PureComponent<
  Props,
  State,
> {
  state: State = {
    excludedItemIds: this.props.initialExcludedItems,
    settingsButtonElt: undefined,
    showExcludedItemsPopover: false,
  };

  @autobind
  toggleCheckedValue(isSelected: boolean, dashboardQueryId: string): void {
    const { excludedItemIds } = this.state;
    if (isSelected) {
      const index = excludedItemIds.indexOf(dashboardQueryId);
      // remove dashboardQueryId from the list of excluded ids
      return this.setState({ excludedItemIds: excludedItemIds.delete(index) });
    }

    // add dashboardQueryId to the list of
    return this.setState({
      excludedItemIds: excludedItemIds.push(dashboardQueryId),
    });
  }

  @autobind
  onToggleExcludedItemVisibility() {
    this.setState(prevState => ({
      showExcludedItemsPopover: !prevState.showExcludedItemsPopover,
    }));
  }

  @autobind
  onUpdateExcludedItems(excludedItemIds: Zen.Array<string>) {
    this.setState({ excludedItemIds });
  }

  @autobind
  onCloseExcludeItemPopover() {
    this.setState({ showExcludedItemsPopover: false });
  }

  @autobind
  onOpenExcludeItemPopover() {
    this.setState({ showExcludedItemsPopover: true });
  }

  @autobind
  onApplyExcludedItems() {
    this.props.onExcludedItemsUpdate(this.state.excludedItemIds);
    this.onCloseExcludeItemPopover();
  }

  @autobind
  onSettingsButtonClick(event: SyntheticMouseEvent<HTMLSpanElement>) {
    const settingsButtonElt = event.currentTarget;
    this.setState(prevState => ({
      settingsButtonElt,
      showExcludedItemsPopover: !prevState.showExcludedItemsPopover,
    }));
  }

  renderDashboardItemOtions(): React.Node {
    const { dashboardQueryItemTitles } = this.props;
    const { excludedItemIds } = this.state;
    return (
      <Group.Vertical spacing="s">
        {Object.keys(dashboardQueryItemTitles).map(tileId => (
          <Checkbox
            key={tileId}
            className="gd-exclusion-settings-popover__checkbox"
            label={dashboardQueryItemTitles[tileId]}
            labelPlacement="right"
            onChange={isSelected => this.toggleCheckedValue(isSelected, tileId)}
            value={!excludedItemIds.includes(tileId)}
          />
        ))}
      </Group.Vertical>
    );
  }

  renderApplyButton(): React.Node {
    return (
      <FullButton
        ariaName="apply"
        className="aqt-customization-module-wrapper__apply-btn"
        onClick={this.onApplyExcludedItems}
      >
        <Heading.Small whiteText>apply</Heading.Small>
      </FullButton>
    );
  }

  renderExclusionSettingButton(): React.Node {
    return (
      <Icon
        className={this.props.className}
        onClick={this.onSettingsButtonClick}
        type="cog"
      />
    );
  }

  renderItemPopover(): React.Node {
    return (
      <Popover
        anchorElt={this.state.settingsButtonElt}
        anchorOrigin={Popover.Origins.BOTTOM_LEFT}
        containerType={Popover.Containers.EMPTY}
        doNotFlip
        isOpen={this.state.showExcludedItemsPopover}
        keepInWindow
        onRequestClose={this.onCloseExcludeItemPopover}
        popoverOrigin={Popover.Origins.TOP_LEFT}
      >
        <Group.Vertical padding="m" spacing="s">
          <div>{this.props.header}</div>
          {this.renderDashboardItemOtions()}
        </Group.Vertical>
        {this.renderApplyButton()}
      </Popover>
    );
  }

  renderExclusionTooltip(): React.Node {
    const { excludedItemIds } = this.state;
    const { className, dashboardQueryItemTitles } = this.props;
    const exclusionItems = Object.keys(dashboardQueryItemTitles).map(
      tileId =>
        excludedItemIds.includes(tileId) && (
          <li key={tileId}>{dashboardQueryItemTitles[tileId]}</li>
        ),
    );
    // NOTE: Use exclusionItems rather than excludedItemIds because some dashboards have
    // excluded ids that no longer match tiles.
    if (!exclusionItems.filter(Boolean).length) {
      // NOTE: Top margin and padding change if this is null.
      return <span className={className} />;
    }
    const tooltipContent: React.Node = (
      <React.Fragment>
        {I18N.text(
          'The following Queries do not respect this',
          'exclusionSettingsHiddenHeader',
        )}
        <ul style={{ listStyleType: 'none' }}>{exclusionItems}</ul>
      </React.Fragment>
    );

    return (
      <div className={className}>
        <Tooltip content={tooltipContent}>
          <Icon type="svg-check-list" />
        </Tooltip>
      </div>
    );
  }

  renderExclusionSetting(): React.Node {
    return (
      <React.Fragment>
        {this.renderExclusionSettingButton()}
        {this.renderItemPopover()}
      </React.Fragment>
    );
  }

  render(): React.Node {
    const exclusionSettingsButton = this.props.showExclusionsAsTooltip
      ? this.renderExclusionTooltip()
      : this.renderExclusionSetting();
    return exclusionSettingsButton;
  }
}
