// @flow
// NOTE(stephen): Button design inspired by material-ui. SVG paths borrowed
// from that project.
import * as React from 'react';
import classNames from 'classnames';

import normalizeARIAName from 'components/ui/util/normalizeARIAName';

type DefaultProps = {
  className: string,
};

type Props = {
  ...DefaultProps,

  /** The page numbers are 1-indexed */
  currentPage: number,

  /**
   * Callback to control the page changes. This is a controlled component so
   * a callback must be provided otherwise the component will be useless.
   * @param {number} newPage the new page number to change to
   */
  onPageChange: (newPage: number) => void,

  /** How many items are in each page */
  pageSize: number,

  /** How many items are there total */
  resultCount: number,
};

type Direction = 'PREVIOUS' | 'NEXT';

const TEXT = t('ui.PageSelector');

const BUTTON_ICON_PATH = {
  PREVIOUS: 'M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z',
  NEXT: 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
};

const ABSOLUTE_BUTTON_ICON_PATH = {
  PREVIOUS: 'M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6zM6 6h2v12H6z',
  NEXT: 'M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6zM16 6h2v12h-2z',
};

function renderButton(
  onClick: void | (() => void),
  path: string,
  disabled: boolean,
  ariaName: string,
): React.Element<'button'> {
  const arrowClassName = classNames('zen-page-selector__arrow', {
    'zen-page-selector__arrow--disabled': disabled,
  });
  return (
    <button
      aria-label={normalizeARIAName(ariaName)}
      className="zen-page-selector__button"
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      <svg className={arrowClassName} viewBox="0 0 24 24">
        <path d={path} />
      </svg>
    </button>
  );
}

/**
 * A generic component to display the number of viewable items in a page.
 * This can be used on any components that need pagination.
 *
 * This is a **controlled** component, so the current page number must be
 * stored by the parent component, and updated through the `onPageChange`
 * callback.
 */
export default class PageSelector extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    className: '',
  };

  maybeRenderPageRange(): React.Element<'span'> | null {
    const { currentPage, pageSize, resultCount } = this.props;
    if (resultCount === 0) {
      return null;
    }

    const startRow = (currentPage - 1) * pageSize + 1;
    const endRow = Math.min(resultCount, currentPage * pageSize);
    return (
      <span className="zen-page-selector__page-range">
        {startRow} - {endRow} of {resultCount}
      </span>
    );
  }

  renderAbsoluteArrowButton(direction: Direction): React.Element<'button'> {
    const { currentPage, onPageChange, pageSize, resultCount } = this.props;
    const nextPage =
      direction === 'PREVIOUS' ? 1 : Math.ceil(resultCount / pageSize);
    const disabled = nextPage === currentPage || resultCount === 0;
    const onClick = !disabled ? () => onPageChange(nextPage) : undefined;
    return renderButton(
      onClick,
      ABSOLUTE_BUTTON_ICON_PATH[direction],
      disabled,
      direction === 'PREVIOUS' ? TEXT.firstPage : TEXT.lastPage,
    );
  }

  renderArrowButton(
    direction: Direction,
    nextPage: number,
  ): React.Element<'button'> {
    const { onPageChange, pageSize, resultCount } = this.props;
    const maxPages = Math.ceil(resultCount / pageSize);
    const disabled = nextPage < 1 || nextPage > maxPages;
    const onClick = !disabled ? () => onPageChange(nextPage) : undefined;

    return renderButton(
      onClick,
      BUTTON_ICON_PATH[direction],
      disabled,
      direction === 'PREVIOUS' ? TEXT.previousPage : TEXT.nextPage,
    );
  }

  render(): React.Element<'div'> {
    const { className, currentPage } = this.props;
    return (
      <div className={`zen-page-selector ${className}`}>
        {this.maybeRenderPageRange()}
        {this.renderAbsoluteArrowButton('PREVIOUS')}
        {this.renderArrowButton('PREVIOUS', currentPage - 1)}
        {this.renderArrowButton('NEXT', currentPage + 1)}
        {this.renderAbsoluteArrowButton('NEXT')}
      </div>
    );
  }
}
