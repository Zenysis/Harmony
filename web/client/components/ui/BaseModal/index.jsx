// @flow
import * as React from 'react';
import Modal from 'react-modal';

import Button from 'components/ui/Button';
import Heading from 'components/ui/Heading';
import Intents from 'components/ui/Intents';
import ResizeService from 'services/ResizeService';
import autobind from 'decorators/autobind';
import { debounce, noop } from 'util/util';
import type { StyleObject } from 'types/jsCore';
import type { SubscriptionObject } from 'services/ResizeService';

type Props = {
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

  /** Children will render in the modal body */
  children: React.Node,

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
  title: string,

  /** An optional tooltip to render next to the title */
  titleTooltip: string,

  /** The exact pixel width of the modal */
  width: number,
};

type State = {
  footerHeight: number,
  headerHeight: number,
  windowHeight: number,
  windowWidth: number,
};

const TEXT = t('ui.BaseModal');
const WINDOW_RESIZE_DEBOUNCE_TIMEOUT = 100;

/**
 * A basic modal with a lot of configuration options.
 *
 * It can render up to 2 action buttons, and a Close button. If you needed
 * more customization on what buttons to show in the footer, you should set
 * a `customFooter`, which will override the default modal footer.
 *
 * If you needed increased customization on what to render after the modal's
 * title, you should use the `secondaryTitleContent` prop to pass a render
 * function.
 *
 */
export default class BaseModal extends React.PureComponent<Props, State> {
  static Intents = Intents;

  static defaultProps = {
    className: '',
    closeButtonText: TEXT.closeText,
    children: null,
    contentAfterActionButtons: null,
    contentBeforeActionButtons: null,
    customFooter: null,
    defaultHeight: 400,
    defaultPercentTop: 10,
    disablePrimaryButton: false,
    disableSecondaryButton: false,
    fullScreen: false,
    onRequestClose: noop,
    onPrimaryAction: noop,
    onSecondaryAction: noop,
    primaryButtonOutline: false,
    primaryButtonText: TEXT.primaryText,
    primaryButtonIntent: Intents.PRIMARY,
    secondaryTitleContent: null,
    secondaryButtonOutline: false,
    secondaryButtonText: TEXT.secondaryText,
    secondaryButtonIntent: Intents.DANGER,
    shouldCloseOnOverlayClick: true,
    showCloseButton: true,
    showFooter: true,
    showHeader: true,
    showPrimaryButton: true,
    showSecondaryButton: false,
    showXButton: true,
    title: '',
    titleTooltip: '',
    width: 600,
  };

  state = {
    footerHeight: this.props.showFooter ? 60 : 0,
    headerHeight: this.props.showHeader ? 70 : 0,
    windowHeight: window.innerHeight,
    windowWidth: window.innerWidth,
  };

  _headerElt: $RefObject<'div'> = React.createRef();
  _footerElt: $RefObject<'div'> = React.createRef();
  _resizeSubscription: SubscriptionObject | void = undefined;

  componentDidMount() {
    // Watch for resize events so we can adjust the modal's positioning.
    this._resizeSubscription = ResizeService.subscribe(
      debounce(this.onWindowResize, WINDOW_RESIZE_DEBOUNCE_TIMEOUT),
    );
    this.resetHeaderFooterHeight();
  }

  componentDidUpdate() {
    this.resetHeaderFooterHeight();
  }

  componentWillUnmount() {
    if (this._resizeSubscription) {
      ResizeService.unsubscribe(this._resizeSubscription);
    }
  }

  resetHeaderFooterHeight(): void {
    // check the header height on the DOM and set this value in the state,
    // so that we can know the correct positioning of the modal body
    if (this._headerElt.current) {
      this.setState({ headerHeight: this._headerElt.current.offsetHeight });
    }

    // now do the same for the footer
    if (this._footerElt.current) {
      this.setState({ footerHeight: this._footerElt.current.offsetHeight });
    }
  }

  getModalBodyStyle(): StyleObject {
    const { headerHeight, footerHeight } = this.state;
    return {
      top: headerHeight,
      bottom: footerHeight,
    };
  }

  getTransitionHeight(): number {
    const { defaultHeight, defaultPercentTop } = this.props;
    if (typeof defaultHeight === 'number') {
      return (50 * defaultHeight) / (50 - defaultPercentTop);
    }
    throw new Error(
      '[BaseModal] getTransitionHeight: cannot perform numeric calculations because defaultHeight is not a number',
    );
  }

  shouldCenter(): boolean {
    if (typeof this.props.defaultHeight === 'number') {
      return this.state.windowHeight < this.getTransitionHeight();
    }
    return false;
  }

  getWidthSensitiveStyles() {
    const { defaultHeight, defaultPercentTop, fullScreen } = this.props;

    if (fullScreen) {
      return {
        height: '100vh',
        left: 0,
        marginTop: 0,
        top: 0,
        transform: 'translate(0px)',
        width: '100vw',
      };
    }

    const shouldCenter = this.shouldCenter();
    const centeredMargins =
      typeof defaultHeight === 'number'
        ? this.getTransitionHeight() - defaultHeight
        : 0;
    const percentTop = shouldCenter ? 50 : defaultPercentTop;
    const width = Math.min(this.props.width, this.state.windowWidth - 30);

    return {
      width,
      height: shouldCenter
        ? `calc(100vh - ${centeredMargins}px)`
        : defaultHeight,
      left: '50%',
      marginTop: shouldCenter ? `calc(-50vh + ${centeredMargins / 2}px)` : 0,
      top: `${percentTop}vh`,
      transform: `translate(-${width / 2}px)`,
    };
  }

  getModalStyles(): { content: StyleObject, overlay: StyleObject } | void {
    if (!this.props.show) {
      return undefined;
    }

    const widthSensitiveStyles = this.getWidthSensitiveStyles();
    const content = {
      background: '#ffffff',
      border: 'solid 1px #f3f4f6',
      borderRadius: 5,
      boxShadow:
        '0 2px 10px 0 rgba(0, 0, 0, 0.25), -10px 10px 20px 0 rgba(30, 30, 30, 0.05)',
      height: widthSensitiveStyles.height,
      top: widthSensitiveStyles.top,
      marginTop: widthSensitiveStyles.marginTop,
      left: widthSensitiveStyles.left,
      transform: widthSensitiveStyles.transform,
      outline: 'none',
      overflow: 'auto',
      padding: 0,
      position: 'absolute',
      WebkitOverflowScrolling: 'touch',
      width: widthSensitiveStyles.width,
    };

    const overlay = {
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      bottom: 0,
      left: 0,
      position: 'fixed',
      right: 0,
      top: 0,
      zIndex: 9999,
    };

    return { content, overlay };
  }

  @autobind
  onWindowResize(event: Event, dimensions: { width: number, height: number }) {
    const { width, height } = dimensions;
    this.setState({
      windowHeight: height,
      windowWidth: width,
    });
  }

  maybeRenderCloseButton() {
    const { showCloseButton, closeButtonText, onRequestClose } = this.props;
    if (!showCloseButton) {
      return null;
    }
    return (
      <Button
        outline
        onClick={onRequestClose}
        size={Button.Sizes.MEDIUM}
        testId="zen-modal-close-button"
      >
        {closeButtonText}
      </Button>
    );
  }

  maybeRenderContentBeforeActionButtons() {
    const { contentBeforeActionButtons } = this.props;
    if (contentBeforeActionButtons) {
      return (
        <div className="zen-modal-footer__content-before-action-btns">
          {contentBeforeActionButtons}
        </div>
      );
    }
    return null;
  }

  maybeRenderContentAfterActionButtons() {
    const { contentAfterActionButtons } = this.props;
    if (contentAfterActionButtons) {
      return (
        <div className="zen-modal-footer__content-after-action-btns">
          {contentAfterActionButtons}
        </div>
      );
    }
    return null;
  }

  maybeRenderModalFooter() {
    if (!this.props.showFooter) {
      return null;
    }

    let footerContents = this.props.customFooter;
    if (!footerContents) {
      footerContents = (
        <div className="zen-modal-footer__button-row">
          {this.maybeRenderContentBeforeActionButtons()}
          {this.maybeRenderPrimaryButton()}
          {this.maybeRenderSecondaryButton()}
          {this.maybeRenderCloseButton()}
          {this.maybeRenderContentAfterActionButtons()}
        </div>
      );
    }

    return (
      <div className="zen-modal-footer" ref={this._footerElt}>
        {footerContents}
      </div>
    );
  }

  maybeRenderSecondaryTitleContent() {
    const { secondaryTitleContent } = this.props;
    if (secondaryTitleContent) {
      return (
        <div className="zen-modal-header__secondary-content">
          {secondaryTitleContent}
        </div>
      );
    }
    return null;
  }

  maybeRenderModalHeader() {
    const { showHeader, title, titleTooltip } = this.props;
    if (!showHeader) {
      return null;
    }

    return (
      <div
        className="zen-modal-header"
        ref={this._headerElt}
        zen-test-id="base-modal-header"
      >
        <Heading.Small
          className="zen-modal-header__title"
          infoTooltip={titleTooltip}
        >
          {title}
        </Heading.Small>
        {this.maybeRenderSecondaryTitleContent()}
      </div>
    );
  }

  maybeRenderPrimaryButton() {
    const {
      showPrimaryButton,
      primaryButtonIntent,
      primaryButtonOutline,
      onPrimaryAction,
      disablePrimaryButton,
      primaryButtonText,
    } = this.props;
    if (!showPrimaryButton) {
      return null;
    }

    return (
      <Button
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
  }

  maybeRenderSecondaryButton() {
    const {
      showSecondaryButton,
      secondaryButtonOutline,
      disableSecondaryButton,
      secondaryButtonIntent,
      onSecondaryAction,
      secondaryButtonText,
    } = this.props;
    if (!showSecondaryButton) {
      return null;
    }

    return (
      <Button
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
  }

  maybeRenderXButton() {
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

  renderModalBody() {
    return (
      <div className="zen-modal__body" style={this.getModalBodyStyle()}>
        {this.props.children}
      </div>
    );
  }

  render() {
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
        style={(this.getModalStyles(): any)}
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
}
