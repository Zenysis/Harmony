// @flow
import * as React from 'react';
import classNames from 'classnames';

import BaseModal from 'components/ui/BaseModal';
import Button from 'components/ui/Button';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import Page from 'components/ui/ProgressModal/internal/Page';
import { noop } from 'util/util';

type Props = {
  /** Children must be Progress Page components */
  children: React.ChildrenArray<?React.Element<typeof Page>>,

  /**
   * Whether or not to show the modal. If false, the modal will remain mounted,
   * it just won't render. If you needed to re-mount the modal (which clears all
   * state), then you should have the modal's parent render `null` instead.
   * The current page will be reset to the beginning when the modal closes.
   */
  show: boolean,

  /** Text for the button that closes the modal without further actions */
  cancelButtonText?: string,

  /** The class name to apply at the top level of the modal */
  className?: string,

  childWrapperClassName?: string,

  /** Text for button that goes to the previous page in the modal */
  backButtonText?: string,

  /** Make the modal take up the entire screen */
  fullScreen?: boolean,

  /**
   * The fixed height of the modal. Optional. If specified, modal will always
   * take up this much space. If unspecified, modal will take up the height of
   * the rendered content.
   */
  height?: number | string | void,

  /** The max height of the modal */
  maxHeight?: number | string | void,

  /** The max width of the modal */
  maxWidth?: number | string | void,

  /**
   * Event handler for when the modal needs to close. This can be called in
   * 4 different ways:
   *
   * - when the modal X button is clicked
   * - when the user presses Escape
   * - when the user clicks on the background overlay
   */
  onRequestClose?: (SyntheticEvent<>) => void,

  /** Should this modal close when we click the overlay? */
  shouldCloseOnOverlayClick?: boolean,

  // TODO(sophie, anyone): decide whether this should be a controlled component
  /** The zero-indexed page from the child components to start on */
  startingPageIdx?: number,

  /** The modal title to render in the header */
  title?: string,

  /** An optional tooltip to render next to the title */
  titleTooltip?: string,

  /** The width of the modal */
  width?: number | string | void,
};

/**
 * A modal with multiple pages that keeps track of progress through the pages
 */
export default function ProgressModal({
  show,
  backButtonText = I18N.text('back'),
  cancelButtonText = I18N.textById('cancel'),
  className = '',
  children = null,
  childWrapperClassName = '',
  fullScreen = false,
  height = undefined,
  maxHeight = undefined,
  maxWidth = undefined,
  onRequestClose = noop,
  shouldCloseOnOverlayClick = true,
  startingPageIdx = 0,
  title = '',
  titleTooltip = '',
  width = undefined,
}: Props): React.Element<typeof BaseModal> {
  const [currentPageIdx, setCurrentPageIdx] = React.useState(startingPageIdx);

  const pages = [];
  React.Children.forEach(children, child => {
    if (child) {
      pages.push(child);
    }
  });

  const currentPage = pages[currentPageIdx];
  const {
    disableMainButton,
    onMainButtonClick: onPageMainButtonClick,
    mainButtonText,
  } = currentPage.props;

  const onBackClick = () => {
    setCurrentPageIdx(currentPageIdx - 1);
  };

  const onMainButtonClick = (e: SyntheticEvent<>) => {
    if (onPageMainButtonClick) {
      onPageMainButtonClick(e);
    }
    if (currentPageIdx >= pages.length - 1) {
      onRequestClose(e);
    } else {
      setCurrentPageIdx(currentPageIdx + 1);
    }
  };

  const pageHeaders =
    // Don't show the page headers if there is only one page
    pages.length > 1
      ? pages.map((page, pageIdx) => {
          const { name } = page.props;
          // this includes both the title and the arrow icon
          const headerProgressClass = classNames({
            'zen-progress-modal__header--disabled': pageIdx > currentPageIdx,
          });
          // this includes just the title
          const titleClass = classNames({
            'zen-progress-modal__header--current': pageIdx === currentPageIdx,
          });

          return (
            <span className={headerProgressClass} key={name}>
              {pageIdx !== 0 && (
                <Icon
                  type="chevron-right"
                  className="zen-progress-modal__header-icon"
                />
              )}
              <span className={titleClass}>{name}</span>
            </span>
          );
        })
      : null;

  const header = (
    <div className="zen-progress-modal__header">
      <Heading.Medium
        className="zen-progress-modal__title"
        infoTooltip={titleTooltip}
      >
        {title}
      </Heading.Medium>
      <Group.Horizontal className="u-heading-small" spacing="none">
        {pageHeaders}
      </Group.Horizontal>
    </div>
  );

  const footer = (
    <div className="zen-progress-modal__footer">
      <Group.Item marginLeft="l">
        <Button minimal onClick={onRequestClose}>
          {cancelButtonText}
        </Button>
      </Group.Item>
      <Group.Horizontal marginRight="l">
        {currentPageIdx !== 0 && (
          <Button minimal onClick={onBackClick}>
            {backButtonText}
          </Button>
        )}
        <Button
          onClick={onMainButtonClick}
          disabled={disableMainButton || false}
        >
          {mainButtonText || I18N.text('Next')}
        </Button>
      </Group.Horizontal>
    </div>
  );

  return (
    <BaseModal
      showXButton
      show={show}
      className={`zen-progress-modal ${className}`}
      customFooter={footer}
      customHeader={header}
      fullScreen={fullScreen}
      height={height}
      maxHeight={maxHeight}
      maxWidth={maxWidth}
      onRequestClose={onRequestClose}
      shouldCloseOnOverlayClick={shouldCloseOnOverlayClick}
      title={title}
      titleTooltip={titleTooltip}
      width={width}
    >
      <div className={childWrapperClassName}>{currentPage}</div>
    </BaseModal>
  );
}

ProgressModal.Page = Page;
