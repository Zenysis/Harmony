// @flow
import * as React from 'react';
import classNames from 'classnames';

import Spacing from 'components/ui/Spacing';
import useSpacingStyles from 'components/ui/Group/useSpacingStyles';
import type { StyleObject } from 'types/jsCore';

export type SpacingT =
  | 'none'
  | 'xxxs'
  | 'xxs'
  | 'xs'
  | 's'
  | 'm'
  | 'l'
  | 'xl'
  | 'xxl'
  | 'xxxl';

export type SpacingUnit = 'px' | 'em';

type Props = {
  /**
   * Flexbox `align-content` CSS property. Will only do anything if you set the
   * `flex` prop.
   */
  alignContent?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly',

  /**
   * Flexbox `align-items` CSS property. Will only do anything if you set the
   * `flex` prop.
   */
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline',

  /**
   * Flexbox `align-self` CSS property. Will only do anything if the parent
   * is set to `display: flex`.
   */
  alignSelf?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline',

  ariaRole?: string,

  children: React.Node,

  /** The class name for the group container */
  className?: string,

  /** The direction that items will be placed in for this group */
  direction?: 'horizontal' | 'vertical',

  /** The class name for the first group item. */
  firstItemClassName?: string,

  /** The flex value for all items. */
  firstItemFlexValue?: string | number,

  /** The style for the first group item. */
  firstItemStyle?: StyleObject,

  /** Sets this group to a flex display */
  flex?: boolean,

  /**
   * Sets the flex value (e.g. flex: 1) for the entire group container. If you
   * wanted to set a flex value for the contained items then you should use
   * `itemFlexValue`, `lastItemFlexValue`, `firstItemFlexValue`, or
   * [`<Spacing>`](#spacing) instead.
   */
  flexValue?: string | number,

  /** The class name for all items. */
  itemClassName?: string,

  /** The flex value for all items. */
  itemFlexValue?: string | number,

  /** A style object to set on all items. */
  itemStyle?: StyleObject,

  /**
   * Flexbox `justify-content` CSS property. Will only do anything if you set
   * the `flex` prop.
   */
  justifyContent?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly',

  /** The class name for the last group item */
  lastItemClassName?: string,

  /** The flex value for all items. */
  lastItemFlexValue?: string | number,

  /** The style for the last group item */
  lastItemStyle?: StyleObject,

  /** Will apply the same margin to bottom, left, right, and top */
  margin?: SpacingT,
  marginBottom?: SpacingT,
  marginLeft?: SpacingT,
  marginRight?: SpacingT,
  marginTop?: SpacingT,
  marginUnit?: SpacingUnit,

  /** Will apply the same margin to `marginLeft` and `marginRight` */
  marginX?: SpacingT,

  /** Will apply the same margin to `marginTop` and `marginBottom` */
  marginY?: SpacingT,

  /** Will apply the same padding to bottom, left, right, and top */
  padding?: SpacingT,
  paddingBottom?: SpacingT,
  paddingLeft?: SpacingT,
  paddingRight?: SpacingT,
  paddingTop?: SpacingT,
  paddingUnit?: SpacingUnit,

  /** Will apply the same margin to `paddingLeft` and `paddingRight` */
  paddingX?: SpacingT,

  /** Will apply the same margin to `paddingTop` and `paddingBottom` */
  paddingY?: SpacingT,

  /** The spacing between all items inside the group. */
  spacing?: SpacingT,

  /** The spacing unit that will be used. */
  spacingUnit?: SpacingUnit,

  /** The style to set on the group container */
  style?: StyleObject,

  /** The `data-testid` attribute to the Group container. */
  testId?: string,
};

type RenderableReactNode =
  | string
  | number
  | React.MixedElement
  | React.Portal
  | Iterable<?React.Node>;

/**
 * A convenience component to group items together with standardized spacing.
 * Use either `<Group.Horizontal>` or `<Group.Vertical>`.
 *
 * We default to using `px` for spacing. You should only use `em` when the font
 * size in your components might change dynamically (e.g. through user input),
 * and you cannot predict what the appropriate spacing should be. In this case,
 * `em` is a more suitable unit because it is relative to font size (meaning
 * larger font sizes will have larger spacings).
 *
 * Typically, you will only need the `spacing` prop to manage spacing between
 * items.
 *
 * If the entire group container needs to have margin or padding applied to it,
 * then look at the `margin*` and `padding*` props. If there is an individual
 * item that needs to have its own unique spacing, look into using the
 * [`<Spacing>`](#spacing) component, which can also be accessed via the
 * [`<Group.Item>`](#spacing) alias.
 */
export default function Group({
  children,
  alignContent = undefined,
  alignItems = undefined,
  alignSelf = undefined,
  ariaRole = undefined,
  className = '',
  direction = 'horizontal',
  firstItemClassName = '',
  firstItemFlexValue = undefined,
  firstItemStyle = undefined,
  flex = false,
  flexValue = undefined,
  itemClassName = '',
  itemFlexValue = undefined,
  itemStyle = undefined,
  justifyContent = undefined,
  lastItemClassName = '',
  lastItemFlexValue = undefined,
  lastItemStyle = undefined,
  margin = undefined,
  marginBottom = undefined,
  marginLeft = undefined,
  marginRight = undefined,
  marginTop = undefined,
  marginUnit = undefined,
  marginX = undefined,
  marginY = undefined,
  padding = undefined,
  paddingBottom = undefined,
  paddingLeft = undefined,
  paddingRight = undefined,
  paddingTop = undefined,
  paddingUnit = undefined,
  paddingX = undefined,
  paddingY = undefined,
  spacing = 's',
  spacingUnit = 'px',
  style = undefined,
  testId = undefined,
}: Props): React.Element<'div'> {
  const vertical = direction === 'vertical';

  // first, filter out all non-renderable children
  const filteredChildren: Array<RenderableReactNode> = [];
  React.Children.forEach(children, child => {
    if (child !== undefined && child !== null && typeof child !== 'boolean') {
      filteredChildren.push(child);
    }
  });
  const numChildren = filteredChildren.length;

  const wrappedChildren = filteredChildren.map((child, i) => {
    // get the style object for this child
    let groupItemStyle = itemStyle;
    if (i === 0 && firstItemStyle) {
      groupItemStyle = firstItemStyle;
    } else if (i === numChildren - 1 && lastItemStyle) {
      groupItemStyle = lastItemStyle;
    }

    // get the class name for this child
    let groupItemClassName = itemClassName;
    if (i === 0 && firstItemClassName) {
      groupItemClassName = firstItemClassName;
    } else if (i === numChildren - 1 && lastItemClassName) {
      groupItemClassName = lastItemClassName;
    }

    // get the flex value for this child
    let groupItemFlexValue = itemFlexValue;
    if (i === 0 && firstItemFlexValue !== undefined) {
      groupItemFlexValue = firstItemFlexValue;
    } else if (i === numChildren - 1 && lastItemFlexValue !== undefined) {
      groupItemFlexValue = lastItemFlexValue;
    }

    const itemSpacing = i === numChildren - 1 ? 'none' : spacing;

    // use the `spacing` prop to determine the group's marginBottom and
    // marginRight values
    const marginProps = {
      marginBottom: vertical ? itemSpacing : undefined,
      marginRight: vertical ? undefined : itemSpacing,
    };

    // $FlowExpectedError[incompatible-type] Flow is right but this is the best way we have to refine a node to a Spacing element
    if (child.type === Spacing) {
      // if the child is Spacing element, then we need to merge in
      // the groupItemStyle, groupItemClassName, and marginProps we've
      // computed UNLESS this Spacing is overriding them
      const spacingElt = ((child: $Cast): React.Element<typeof Spacing>);
      const { key, props: childProps } = spacingElt;
      return React.cloneElement(spacingElt, {
        ...marginProps,
        className: groupItemClassName,
        flexValue: groupItemFlexValue,
        key: key || i,
        spacingUnit,
        style: groupItemStyle,
        ...childProps,
      });
    }

    // $FlowExpectedError[incompatible-type] Flow is right but we don't have a good way to check if a node is a React.Element
    const childKey: React.Key | void = child.key ? child.key : undefined;
    return (
      <Spacing
        key={childKey || i}
        {...marginProps}
        className={groupItemClassName}
        flexValue={groupItemFlexValue}
        spacingUnit={spacingUnit}
        style={groupItemStyle}
      >
        {child}
      </Spacing>
    );
  });

  const spacingStyle = useSpacingStyles({
    margin,
    marginBottom,
    marginLeft,
    marginRight,
    marginTop,
    marginUnit: marginUnit || spacingUnit,
    marginX,
    marginY,
    padding,
    paddingBottom,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingUnit: paddingUnit || spacingUnit,
    paddingX,
    paddingY,
  });

  const groupClassName = classNames('zen-group', className, {
    'zen-group--flex': flex && !vertical,
    'zen-group--flex-vertical': flex && vertical,
    'zen-group--horizontal': !vertical,
  });

  const userDefinedStyle = style || {};
  const groupStyle = {
    ...spacingStyle,
    ...userDefinedStyle,
    alignContent: alignContent || userDefinedStyle.alignContent,
    alignItems: alignItems || userDefinedStyle.alignItems,
    alignSelf: alignSelf || userDefinedStyle.alignSelf,
    flex: flexValue || userDefinedStyle.flex,
    justifyContent: justifyContent || userDefinedStyle.justifyContent,
  };

  return (
    <div
      className={groupClassName}
      data-testid={testId}
      role={ariaRole}
      style={groupStyle}
    >
      {wrappedChildren}
    </div>
  );
}

Group.Horizontal = (
  props: $Diff<React.ElementConfig<typeof Group>, { direction: mixed }>,
): React.Element<typeof Group> => <Group {...props} />;

Group.Vertical = (
  props: $Diff<React.ElementConfig<typeof Group>, { direction: mixed }>,
): React.Element<typeof Group> => <Group direction="vertical" {...props} />;

Group.Item = Spacing;
