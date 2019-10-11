// @flow
import * as React from 'react';

import BaseModal from 'components/ui/BaseModal';
import Intents from 'components/ui/Intents';
import Tab from 'components/ui/Tabs/Tab';
import Tabs from 'components/ui/Tabs';
import { noop } from 'util/util';

type Props = {|
  /**
   * Whether or not to show the modal. If false, the modal will remain mounted,
   * it just won't render. If you needed to re-mount the modal (which clears all
   * state), then you should have the modal's parent render `null` instead.
   */
  show: boolean,

  /** The class name to apply at the top level of the modal */
  className: string,

  /** The text to show on the Close button */
  closeButtonText: string,

  /** Optional content to render after the action buttons. */
  contentAfterActionButtons: React.Node,

  /** Optional content to render before the action buttons. */
  contentBeforeActionButtons: React.Node,

  /** Override the default footer with your own */
  customFooter: React.Node,

  /** Children must be Tab components */
  children: React.ChildrenArray<?React.Element<typeof Tab>>,

  /**
   * The default modal height (in pixels) until the window becomes too small to
   * fit it. At that point this number will be ignored and the modal height will
   * shrink to fit in the window.
   */
  defaultHeight: number | string,

  /**
   * The default percent away from the top of the window to render the modal.
   * When the window becomes too small, this number will be ignored and the
   * modal will always be centered.
   */
  defaultPercentTop: number,
  disablePrimaryButton: boolean,
  disableSecondaryButton: boolean,

  /** Make the modal take up the entire screen */
  fullScreen: boolean,

  /** The name of the first tab to show. Defaults to the first tab. */
  initialTab?: string,

  /** Event handler for when the primary action button is clicked */
  onPrimaryAction: (SyntheticEvent<HTMLButtonElement>) => void,

  /**
   * Event handler for when the modal needs to close. This can be called in
   * 4 different ways:
   *
   * - when the Close button is clicked.
   * - when the modal X button is clicked
   * - when the user presses Escape
   * - when the user clicks on the background overlay
   */
  onRequestClose: (SyntheticEvent<>) => void,

  /** Event handler for when the secondary action button is clicked */
  onSecondaryAction: (SyntheticEvent<HTMLButtonElement>) => void,

  /** Called when the active tab changes */
  onTabChange: (selectedTabName: string) => void,

  /** The primary action button intent */
  primaryButtonIntent: 'primary' | 'danger' | 'success',

  /** Render the primary action button as a button outline */
  primaryButtonOutline: boolean,
  primaryButtonText: string,

  /** The secondary action button intent */
  secondaryButtonIntent: 'primary' | 'danger' | 'success',

  /** Render the secondary action button as a button outline */
  secondaryButtonOutline: boolean,
  secondaryButtonText: string,

  /** Something optional to render after the modal title */
  secondaryTitleContent: React.Node,

  /** Should this modal close when we click the overlay? */
  shouldCloseOnOverlayClick: boolean,

  /**
   * Render the Close button
   */
  showCloseButton: boolean,
  showFooter: boolean,
  showPrimaryButton: boolean,
  showSecondaryButton: boolean,

  /**
   * The spacing between each tab heading. Any valid padding value is allowed
   * here, so you can either pass a percentage width as a string, or an exact
   * pixel width as a number.
   */
  tabHeaderSpacing: string | number,

  /** The modal title to render in the header */
  title: string,

  /** An optional tooltip to render next to the title */
  titleTooltip: string,

  /** The exact pixel width of the modal */
  width: number,
|};

const TEXT = t('common.base_modal');

const defaultProps = {
  className: '',
  closeButtonText: TEXT.close_text,
  children: null,
  contentAfterActionButtons: null,
  contentBeforeActionButtons: null,
  customFooter: null,
  defaultHeight: 400,
  defaultPercentTop: 10,
  disablePrimaryButton: false,
  disableSecondaryButton: false,
  fullScreen: false,
  initialTab: undefined,
  onRequestClose: noop,
  onPrimaryAction: noop,
  onSecondaryAction: noop,
  onTabChange: noop,
  primaryButtonOutline: false,
  primaryButtonText: TEXT.primary_text,
  primaryButtonIntent: Intents.PRIMARY,
  secondaryTitleContent: null,
  secondaryButtonOutline: false,
  secondaryButtonText: TEXT.secondary_text,
  secondaryButtonIntent: Intents.DANGER,
  shouldCloseOnOverlayClick: true,
  showCloseButton: true,
  showFooter: true,
  showPrimaryButton: true,
  showSecondaryButton: false,
  tabHeaderSpacing: 30,
  title: '',
  titleTooltip: '',
  width: 600,
};

/**
 * A modal split into tabs.
 */
export default function TabbedModal(props: Props) {
  const {
    className,
    children,
    initialTab,
    onTabChange,
    tabHeaderSpacing,
    title,
    titleTooltip,
    ...passThroughProps
  } = props;
  return (
    <BaseModal
      {...passThroughProps}
      className={`zen-tabbed-modal ${className}`}
      showHeader={false}
      showXButton
    >
      <Tabs
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

TabbedModal.defaultProps = defaultProps;
TabbedModal.Intents = Intents;
