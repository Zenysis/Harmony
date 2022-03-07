// @flow
import * as React from 'react';

import BaseModal from 'components/ui/BaseModal';
import Intents from 'components/ui/Intents';
import Tab from 'components/ui/Tabs/Tab';
import Tabs from 'components/ui/Tabs';
import { noop } from 'util/util';

type Props = {
  /**
   * Whether or not to show the modal. If false, the modal will remain mounted,
   * it just won't render. If you needed to re-mount the modal (which clears all
   * state), then you should have the modal's parent render `null` instead.
   */
  show: boolean,

  /** The class name to apply at the top level of the modal */
  className?: string,

  /** The text to show on the Close button */
  closeButtonText?: string,

  /** Optional content to render after the action buttons. */
  contentAfterActionButtons?: React.Node,

  /** Optional content to render before the action buttons. */
  contentBeforeActionButtons?: React.Node,

  /** Override the default footer with your own */
  customFooter?: React.Node,

  /** Children must be Tab components */
  children?: React.ChildrenArray<?React.Element<typeof Tab>>,
  disablePrimaryButton?: boolean,
  disableSecondaryButton?: boolean,

  /** Make the modal take up the entire screen */
  fullScreen?: boolean,

  /**
   * The fixed height of the modal. Optional. If specified, modal will always
   * take up this much space. If unspecified, modal will take up the height of
   * the rendered content.
   */
  height?: number | string | void,

  /** The name of the first tab to show. Defaults to the first tab. */
  initialTab?: string,

  /** The max height of the modal */
  maxHeight?: number | string | void,

  /** The max width of the modal */
  maxWidth?: number | string | void,

  /** Event handler for when the primary action button is clicked */
  onPrimaryAction?: (SyntheticEvent<HTMLButtonElement>) => void,

  /**
   * Event handler for when the modal needs to close. This can be called in
   * 4 different ways:
   *
   * - when the Close button is clicked.
   * - when the modal X button is clicked
   * - when the user presses Escape
   * - when the user clicks on the background overlay
   */
  onRequestClose?: (SyntheticEvent<>) => void,

  /** Event handler for when the secondary action button is clicked */
  onSecondaryAction?: (SyntheticEvent<HTMLButtonElement>) => void,

  /** Called when the active tab changes */
  onTabChange?: (selectedTabName: string) => void,

  /** The primary action button intent */
  primaryButtonIntent?: 'primary' | 'danger' | 'success',

  /** Render the primary action button as a button outline */
  primaryButtonOutline?: boolean,
  primaryButtonText?: React.Node,

  /** The secondary action button intent */
  secondaryButtonIntent?: 'primary' | 'danger' | 'success',

  /** Render the secondary action button as a button outline */
  secondaryButtonOutline?: boolean,
  secondaryButtonText?: React.Node,

  /** Should this modal close when we click the overlay? */
  shouldCloseOnOverlayClick?: boolean,

  /**
   * Render the Close button
   */
  showCloseButton?: boolean,
  showFooter?: boolean,
  showPrimaryButton?: boolean,
  showSecondaryButton?: boolean,

  /**
   * The spacing between each tab heading. Any valid padding value is allowed
   * here, so you can either pass a percentage width as a string, or an exact
   * pixel width as a number.
   */
  tabHeaderSpacing?: string | number,

  /** The modal title to render in the header */
  title?: string,

  /** An optional tooltip to render next to the title */
  titleTooltip?: string,

  /** The width of the modal */
  width?: number | string | void,
};

const TEXT = t('common.base_modal');

/**
 * A modal split into tabs.
 */
export default function TabbedModal({
  show,
  className = '',
  closeButtonText = TEXT.close_text,
  children = null,
  contentAfterActionButtons = null,
  contentBeforeActionButtons = null,
  customFooter = null,
  disablePrimaryButton = false,
  disableSecondaryButton = false,
  fullScreen = false,
  height = undefined,
  initialTab = undefined,
  maxHeight = undefined,
  maxWidth = undefined,
  onRequestClose = noop,
  onPrimaryAction = noop,
  onSecondaryAction = noop,
  onTabChange = noop,
  primaryButtonOutline = false,
  primaryButtonText = TEXT.primary_text,
  primaryButtonIntent = Intents.PRIMARY,
  secondaryButtonOutline = false,
  secondaryButtonText = TEXT.secondary_text,
  secondaryButtonIntent = Intents.DANGER,
  shouldCloseOnOverlayClick = true,
  showCloseButton = true,
  showFooter = true,
  showPrimaryButton = true,
  showSecondaryButton = false,
  tabHeaderSpacing = 30,
  title = '',
  titleTooltip = '',
  width = undefined,
}: Props): React.Element<typeof BaseModal> {
  return (
    <BaseModal
      showXButton
      show={show}
      className={`zen-tabbed-modal ${className}`}
      showHeader={false}
      closeButtonText={closeButtonText}
      contentAfterActionButtons={contentAfterActionButtons}
      contentBeforeActionButtons={contentBeforeActionButtons}
      customFooter={customFooter}
      disablePrimaryButton={disablePrimaryButton}
      disableSecondaryButton={disableSecondaryButton}
      fullScreen={fullScreen}
      height={height}
      maxHeight={maxHeight}
      maxWidth={maxWidth}
      onRequestClose={onRequestClose}
      onPrimaryAction={onPrimaryAction}
      onSecondaryAction={onSecondaryAction}
      primaryButtonOutline={primaryButtonOutline}
      primaryButtonText={primaryButtonText}
      primaryButtonIntent={primaryButtonIntent}
      secondaryButtonOutline={secondaryButtonOutline}
      secondaryButtonText={secondaryButtonText}
      secondaryButtonIntent={secondaryButtonIntent}
      shouldCloseOnOverlayClick={shouldCloseOnOverlayClick}
      showCloseButton={showCloseButton}
      showFooter={showFooter}
      showPrimaryButton={showPrimaryButton}
      showSecondaryButton={showSecondaryButton}
      title={title}
      titleTooltip={titleTooltip}
      width={width}
    >
      <Tabs
        className="zen-tabbed-modal__tabs"
        initialTab={initialTab}
        onTabChange={onTabChange}
        tabHeaderSpacing={tabHeaderSpacing}
        title={title}
        titleTooltip={titleTooltip}
      >
        {children}
      </Tabs>
    </BaseModal>
  );
}
