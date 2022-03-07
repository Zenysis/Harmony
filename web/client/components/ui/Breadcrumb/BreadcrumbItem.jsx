// @flow
/* eslint-disable react/no-unused-prop-types */
import * as React from 'react';
import classNames from 'classnames';

import Popover from 'components/ui/Popover';
import autobind from 'decorators/autobind';

// NOTE(pablo): <BreadcrumbItem> intentionally has props that it never
// uses (e.g. value).
// The <Breadcrumb> component takes these props and wraps them in a
// <BreadcrumbItemWrapper> which does more complex operations. But we do not
// want anyone using <BreadcrumbItemWrapper> directly because then
// they can override other props (e.g. onClick) which might break things in
// the Breadcrumb component.
type DefaultProps = {
  className: string,

  /** In pixels */
  maxWidth: number | void,
  /** If true and content exceeds maxWidth, we use tooltip to display the full content. */
  useTooltipForTruncatedContent: boolean,
  /** Class name for this item's wrapper */
  wrapperClassName: string,
};

type Props<T> = {
  ...DefaultProps,
  children: React.Node,
  value: T,
};

type State = {
  breadcrumbElt: HTMLDivElement | void,
  popoverOpen: boolean,
};

/**
 * `<BreadcrumbItem>` must be used in conjunction with
 * [`<Breadcrumb>`](#breadcrumb).
 *
 * Use this component to specify the value that will be passed in Breadcrumb's
 * `onItemClick` event handler.
 */
export default class BreadcrumbItem<T> extends React.PureComponent<
  Props<T>,
  State,
> {
  static defaultProps: DefaultProps = {
    className: '',
    maxWidth: undefined,
    useTooltipForTruncatedContent: true,
    wrapperClassName: '',
  };

  state: State = {
    breadcrumbElt: undefined,
    popoverOpen: false,
  };

  @autobind
  onMouseOver(event: SyntheticEvent<HTMLDivElement>) {
    const { maxWidth, useTooltipForTruncatedContent } = this.props;
    const breadcrumbElt = event.currentTarget;
    if (
      maxWidth === undefined ||
      !useTooltipForTruncatedContent ||
      breadcrumbElt.offsetWidth < maxWidth
    ) {
      return;
    }
    this.setState({
      breadcrumbElt,
      popoverOpen: true,
    });
  }

  @autobind
  onMouseOut() {
    this.setState({ popoverOpen: false });
  }

  render(): React.Node {
    const {
      children,
      maxWidth,
      useTooltipForTruncatedContent,
      value,
    } = this.props;
    const { breadcrumbElt, popoverOpen } = this.state;

    if (value === undefined || value === null) {
      throw new Error(
        '[BreadcrumbItem] A breadcrumb item must specify a value',
      );
    }

    const className = classNames('zen-breadcrumb-item', this.props.className, {
      'zen-breadcrumb-item__collapse': useTooltipForTruncatedContent,
    });

    // TODO(yitian, pablo): Replace popover with tooltip when we have our tooltip
    // component ready.
    const popover = useTooltipForTruncatedContent ? (
      <Popover
        anchorElt={breadcrumbElt}
        anchorOrigin={Popover.Origins.BOTTOM_CENTER}
        blurType={Popover.BlurTypes.DOCUMENT}
        className="zen-breadcrumb-item__popover"
        isOpen={popoverOpen}
        popoverOrigin={Popover.Origins.TOP_CENTER}
      >
        {children}
      </Popover>
    ) : null;

    const style =
      useTooltipForTruncatedContent && maxWidth
        ? { maxWidth: `${maxWidth}px` }
        : undefined;

    return (
      <React.Fragment>
        <div
          className={className}
          onBlur={this.onMouseOut}
          onFocus={this.onMouseOver}
          onMouseOver={this.onMouseOver}
          onMouseOut={this.onMouseOut}
          style={style}
        >
          {children}
        </div>
        {popover}
      </React.Fragment>
    );
  }
}
