// @flow
import * as React from 'react';
import Modal from 'react-modal';

import Button from 'components/ui/Button';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import Intents from 'components/ui/Intents';
import ResizeService from 'services/ui/ResizeService';
import Tooltip from 'components/ui/Tooltip';
import { noop } from 'util/util';
import type { StyleObject } from 'types/jsCore';
import type { SubscriptionId } from 'services/ui/types';

/**
 * Check if the current userAgent is that of a mobile device
 */
function isMobileDevice(): boolean {
  return /mobile/i.test(navigator.userAgent);
}

type DefaultProps = {
  /** The class name to apply at the top level of the modal */
  className: string,

  /**
   * The accessibility name for the close button. If none is specified, we will
   * use the button contents.
   */
  closeButtonARIAName?: string,

  /** The text to show on the Close button */
  closeButtonText: string,

  /** Optional content to render after the action buttons. */
  // TODO(pablo): convert this to a render prop
  contentAfterActionButtons: React.Node,

  /** Optional content to render before the action buttons. */
  // TODO(pablo): convert this to a render prop
  contentBeforeActionButtons: React.Node,

  /** Override the default footer with your own */
  // TODO(pablo): convert this to a render prop
  customFooter: React.Node,

  /** Override the default header with your own */
  // TODO(pablo): convert this to a render prop
  customHeader: React.Node,

  /** Children will render in the modal body */
  children: React.Node,

  disablePrimaryButton: boolean,
  disableSecondaryButton: boolean,

  /** Make the modal take up the entire screen */
  fullScreen: boolean,

  /**
   * The fixed height of the modal. Optional. If specified, modal will always
   * take up this much space. If unspecified, modal will take up the height of
   * the rendered content.
   */
  height: number | string | void,

  /** The max height of the modal */
  maxHeight: number | string | void,

  /** The max width of the modal */
  maxWidth: number | string | void,

  /** The min width of the modal */
  minWidth: number | string | void,

  /** Event handler for when the primary action button is clicked */
  onPrimaryAction: (SyntheticMouseEvent<HTMLButtonElement>) => void,

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
  onSecondaryAction: (SyntheticMouseEvent<HTMLButtonElement>) => void,

  /**
   * The accessibility name for the primary button. If none is specified, we
   * will use the button contents if it is a string.
   */
  primaryButtonARIAName?: string,

  /** The primary action button intent */
  primaryButtonIntent: 'primary' | 'danger' | 'success',

  /** Render the primary action button as a button outline */
  primaryButtonOutline: boolean,
  primaryButtonText: React.Node,

  /** Content to show in the primary button's tooltip */
  primaryButtonTooltip?: string,

  /**
   * The accessibility name for the secondary button. If none is specified, we
   * will use the button contents if it is a string.
   */
  secondaryButtonARIAName?: string,

  /** The secondary action button intent */
  secondaryButtonIntent: 'primary' | 'danger' | 'success',

  /** Render the secondary action button as a button outline */
  secondaryButtonOutline: boolean,
  secondaryButtonText: React.Node,

  /** Content to show in the secondary button's tooltip */
  secondaryButtonTooltip?: string,

  /** Should this modal close when we click the overlay? */
  shouldCloseOnOverlayClick: boolean,

  /**
   * Render the Close button. This does not control the top-left X button.
   * Use `showXButton` for that.
   */
  showCloseButton: boolean,
  showFooter: boolean,
  showHeader: boolean,
  showPrimaryButton: boolean,
  showSecondaryButton: boolean,

  /**
   * Render the top-left X button.
   */
  showXButton: boolean,

  /** The modal title to render in the header */
  title: React.Node,

  /** An optional tooltip to render next to the title */
  titleTooltip: string,

  /**
   * The width of the modal. Set width to `"auto"` to make the modal's width
   * automatically adjust to the contents.
   */
  width: number | string,
};

type Props = {
  ...DefaultProps,
  /**
   * Whether or not to show the modal. If false, the modal will remain mounted,
   * it just won't render. If you needed to re-mount the modal (which clears all
   * state), then you should have the modal's parent render `null` instead.
   */
  show: boolean,
};

type State = {
  // this value is only needed if we are on a mobile device. This value is
  // not updated on desktop, because we do not need it there. Only use this
  // value to make necessary adjustments for mobile devices.
  windowHeight: number,
};

const TEXT = t('ui.BaseModal');

/**
 * A basic modal with a lot of configuration options.
 *
 * It can render up to 2 action buttons, and a Close button. If you needed
 * more customization on what buttons to show in the footer, you should set
 * a `customFooter`, which will override the default modal footer.
 *
 * If you needed increased customization on what to render in the modal's
 * header, you should use the `customHeader` prop to pass a render
 * function.
 *
 */
export default class BaseModal extends React.PureComponent<Props, State> {
  static defaultProps: DefaultProps = {
    className: '',
    closeButtonARIAName: undefined,
    closeButtonText: TEXT.closeText,
    children: null,
    contentAfterActionButtons: null,
    contentBeforeActionButtons: null,
    customFooter: null,
    customHeader: null,
    disablePrimaryButton: false,
    disableSecondaryButton: false,
    fullScreen: false,
    height: undefined,
    maxHeight: undefined,
    maxWidth: undefined,
    minWidth: undefined,
    onRequestClose: noop,
    onPrimaryAction: noop,
    onSecondaryAction: noop,
    primaryButtonARIAName: undefined,
    primaryButtonIntent: Intents.PRIMARY,
    primaryButtonOutline: false,
    primaryButtonText: TEXT.primaryText,
    primaryButtonTooltip: undefined,
    secondaryButtonARIAName: undefined,
    secondaryButtonIntent: Intents.DANGER,
    secondaryButtonOutline: false,
    secondaryButtonText: TEXT.secondaryText,
    secondaryButtonTooltip: undefined,
    shouldCloseOnOverlayClick: true,
    showCloseButton: true,
    showFooter: true,
    showHeader: true,
    showPrimaryButton: true,
    showSecondaryButton: false,
    showXButton: true,
    title: '',
    titleTooltip: '',
    width: '70%',
  };

  static Intents: typeof Intents = Intents;

  state: State = {
    windowHeight: window.innerHeight,
  };

  _resizeSubscription: SubscriptionId | void = undefined;

  componentDidMount() {
    // NOTE(pablo): mobile browsers (e.g. Safari and Chrome on iOS) have a very
    // annoying behavior where their address bars are expanded when you first
    // load a page, but after you scroll enough, the address bar shrinks. There
    // is no easy way to detect when this address bar has changed size. The
    // problem is that our modal's CSS depends on 100vh to set a max-height,
    // but the vh unit doesn't play nice with this changing address bar size.
    // So the only reliable way to set a max-height on mobile is to set a resize
    // listener, and get the current window height. When the address bar shrinks
    // or contracts, a resize event is triggered, allowing us to set the correct
    // max-height for the modal.
    if (isMobileDevice()) {
      this._resizeSubscription = ResizeService.subscribe((e, dimensions) => {
        this.setState({ windowHeight: dimensions.height });
      });
    }
  }

  componentWillUnmount() {
    ResizeService.unsubscribe(this._resizeSubscription);
  }

  getModalStyles(): { content: StyleObject, overlay: StyleObject, ... } | void {
    const {
      fullScreen,
      height,
      show,
      width,
      maxWidth,
      minWidth,
      maxHeight,
    } = this.props;
    const { windowHeight } = this.state;

    if (!show) {
      return undefined;
    }

    const maxHeightToSet =
      isMobileDevice() && maxHeight === undefined
        ? windowHeight - 30
        : maxHeight;

    const content = {
      maxWidth,
      minWidth,
      height,
      width,
      maxHeight: maxHeightToSet,
      background: '#ffffff',
      border: 'solid 1px #f3f4f6',
      borderRadius: 5,
      boxShadow:
        '0 2px 10px 0 rgba(0, 0, 0, 0.25), -10px 10px 20px 0 rgba(30, 30, 30, 0.05)',
      outline: 'none',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    };

    if (fullScreen) {
      content.borderRadius = 0;
      content.maxHeight = 'initial';
      content.width = '100vw';
      content.height = '100vh';
    }

    const overlay = {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      top: 0,

      backgroundColor: '#0000004d',
      zIndex: 9999,

      alignItems: 'center',
      display: 'flex',
      justifyContent: 'center',
    };

    return { content, overlay };
  }

  maybeRenderCloseButton(): React.Node {
    const {
      showCloseButton,
      closeButtonText,
      closeButtonARIAName,
      onRequestClose,
    } = this.props;

    if (!showCloseButton) {
      return null;
    }

    return (
      <Button
        outline
        ariaName={closeButtonARIAName}
        onClick={onRequestClose}
        size={Button.Sizes.MEDIUM}
        testId="zen-modal-close-button"
      >
        {closeButtonText}
      </Button>
    );
  }

  maybeRenderContentBeforeActionButtons(): React.Node {
    const { contentBeforeActionButtons } = this.props;
    if (!contentBeforeActionButtons) {
      return null;
    }
    return (
      <div className="zen-modal-footer__content-before-action-btns">
        {contentBeforeActionButtons}
      </div>
    );
  }

  maybeRenderContentAfterActionButtons(): React.Node {
    const { contentAfterActionButtons } = this.props;
    if (!contentAfterActionButtons) {
      return null;
    }
    return (
      <div className="zen-modal-footer__content-after-action-btns">
        {contentAfterActionButtons}
      </div>
    );
  }

  maybeRenderModalFooter(): React.Node {
    if (!this.props.showFooter) {
      return null;
    }

    let footerContents = this.props.customFooter;
    if (!footerContents) {
      footerContents = (
        <Group.Horizontal spacing="m">
          {this.maybeRenderContentBeforeActionButtons()}
          {this.maybeRenderPrimaryButton()}
          {this.maybeRenderSecondaryButton()}
          {this.maybeRenderCloseButton()}
          {this.maybeRenderContentAfterActionButtons()}
        </Group.Horizontal>
      );
    }

    return <div className="zen-modal-footer">{footerContents}</div>;
  }

  maybeRenderModalHeader(): React.Node {
    const { showHeader, title, titleTooltip } = this.props;
    if (!showHeader) {
      return null;
    }

    let headerContents = this.props.customHeader;
    if (!headerContents) {
      headerContents = (
        <Heading.Small
          className="zen-modal-header__title"
          infoTooltip={titleTooltip}
        >
          {title}
        </Heading.Small>
      );
    }
    return (
      <div className="zen-modal-header" data-testid="base-modal-header">
        {headerContents}
      </div>
    );
  }

  maybeRenderPrimaryButton(): React.Node {
    const {
      showPrimaryButton,
      primaryButtonIntent,
      primaryButtonOutline,
      onPrimaryAction,
      disablePrimaryButton,
      primaryButtonText,
      primaryButtonTooltip,
      primaryButtonARIAName,
    } = this.props;
    if (!showPrimaryButton) {
      return null;
    }

    const button = (
      <Button
        ariaName={primaryButtonARIAName}
        disabled={disablePrimaryButton}
        outline={primaryButtonOutline}
        intent={primaryButtonIntent}
        onClick={onPrimaryAction}
        size={Button.Sizes.MEDIUM}
        testId="zen-modal-primary-button"
      >
        {primaryButtonText}
      </Button>
    );

    if (primaryButtonTooltip) {
      return (
        <Tooltip tooltipPlacement="top" content={primaryButtonTooltip}>
          {button}
        </Tooltip>
      );
    }
    return button;
  }

  maybeRenderSecondaryButton(): React.Node {
    const {
      showSecondaryButton,
      secondaryButtonOutline,
      disableSecondaryButton,
      secondaryButtonIntent,
      onSecondaryAction,
      secondaryButtonText,
      secondaryButtonTooltip,
      secondaryButtonARIAName,
    } = this.props;
    if (!showSecondaryButton) {
      return null;
    }

    const button = (
      <Button
        ariaName={secondaryButtonARIAName}
        disabled={disableSecondaryButton}
        outline={secondaryButtonOutline}
        intent={secondaryButtonIntent}
        onClick={onSecondaryAction}
        size={Button.Sizes.MEDIUM}
        testId="zen-modal-secondary-button"
      >
        {secondaryButtonText}
      </Button>
    );

    if (secondaryButtonTooltip) {
      return (
        <Tooltip tooltipPlacement="top" content={secondaryButtonTooltip}>
          {button}
        </Tooltip>
      );
    }
    return button;
  }

  maybeRenderXButton(): React.Node {
    // render the top-right x button to close
    if (!this.props.showXButton) {
      return null;
    }
    return (
      <span
        className="zen-modal__close-x-btn"
        onClick={this.props.onRequestClose}
        role="button"
      >
        &times;
      </span>
    );
  }

  renderModalBody(): React.Node {
    return <div className="zen-modal__body">{this.props.children}</div>;
  }

  render(): React.Element<typeof Modal> {
    const {
      className,
      show,
      onRequestClose,
      shouldCloseOnOverlayClick,
    } = this.props;

    return (
      <Modal
        className={`zen-modal ${className}`}
        contentLabel="Prompt Modal"
        isOpen={show}
        onRequestClose={onRequestClose}
        shouldCloseOnOverlayClick={shouldCloseOnOverlayClick}
        // using $AllowAny here only because the type annotation for react
        // modal is incorrect
        style={(this.getModalStyles(): $AllowAny)}
      >
        {this.maybeRenderModalHeader()}
        {this.renderModalBody()}
        {this.maybeRenderModalFooter()}
        {this.maybeRenderXButton()}
      </Modal>
    );
  }
}

// ReactModal set up:
// Point React Modal to the app element so that it can hide the rest
// of the app from screenreaders while the modal is open
if (document.getElementById('main')) {
  // if the modal is loaded in our Zenysis platform
  Modal.setAppElement('#main');
} else if (document.getElementById('rsg-root')) {
  // if we're rendering in styleguidist
  Modal.setAppElement('#rsg-root');
} else {
  const modalRoot = document.createElement('div');
  modalRoot.setAttribute('id', 'modal-root');
  if (document.body) {
    document.body.appendChild(modalRoot);
    Modal.setAppElement('#modal-root');
  }
}
