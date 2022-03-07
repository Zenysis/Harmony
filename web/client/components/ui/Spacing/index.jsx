// @flow
import * as React from 'react';
import classNames from 'classnames';

import useSpacingStyles from 'components/ui/Group/useSpacingStyles';
import type { StyleObject } from 'types/jsCore';

type SpacingT =
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

type SpacingUnit = 'px' | 'em';

type FlexContentAlignment =
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'space-between'
  | 'space-around'
  | 'space-evenly';

type Props = {
  children: React.Node,

  className?: string,

  /**
   * Flexbox `align-content` CSS property. Will only do anything if you set the
   * `flex` prop.
   */
  alignContent?: FlexContentAlignment,

  /**
   * Flexbox `align-items` CSS property. Will only do anything if you set the
   * `flex` prop.
   */
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline',

  /**
   * Flexbox `align-self` CSS property. Will only do anything if the parent
   * `<Group>` element has a `flex` prop set.
   */
  alignSelf?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline',

  /** Whether or not to set `display: flex` */
  flex?: boolean,

  /**
   * The flex value to set. `flexValue={1}` would translate to the style
   * attribute `flex: 1`.
   */
  flexValue?: string | number,

  /** Whether or not to set `display: inline-block` */
  inlineBlock?: boolean,

  /**
   * Flexbox `justify-content` CSS property. Will only do anything if you set
   * the `flex` prop.
   */
  justifyContent?: FlexContentAlignment,

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

  /** Will apply the same padding to bottom, left, right, and top */
  padding?: SpacingT,

  /** Will apply the same margin to `paddingLeft` and `paddingRight` */
  paddingX?: SpacingT,

  /** Will apply the same margin to `paddingTop` and `paddingBottom` */
  paddingY?: SpacingT,
  style?: StyleObject,
  spacingUnit?: SpacingUnit,

  /** The `data-testid` attribute to the Spacing element */
  testId?: string,
};

/**
 * A convenience component to easily apply spacing (such as margins, paddings,
 * or flex attributes) to any element. It uses our
 * [standard spacing definitions](#spacing).
 *
 * It can be used on its own, or in conjunction with [`<Group>`](#group).
 *
 * Note that `<Group>` can still be used without `<Spacing>`. You only
 * need this component when you want more granular control over how an
 * individual item should be rendered.
 *
 * When used inside a `<Group>`, any margins, paddings, classNames, or
 * other attributes you specify to an individual Spacing element take priority
 * over whatever values were computed by the `<Group>` container.
 *
 * If you use this inside a `<Group>`, we recommend you use the `<Group.Item>`
 * alias as this will save you an import and it follows the semantics of a
 * parent-child relationship.
 */
function Spacing(
  {
    children,
    alignContent = undefined,
    alignItems = undefined,
    alignSelf = undefined,
    className = undefined,
    flex = false,
    flexValue = undefined,
    inlineBlock = undefined,
    justifyContent = undefined,
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
    spacingUnit = 'px',
    style = undefined,
    testId = undefined,
  }: Props,
  ref: $Ref<React.ElementRef<'div'>>,
): React.Element<'div'> {
  const spacingStyle = useSpacingStyles({
    margin,
    marginBottom,
    marginLeft,
    marginRight,
    marginTop,
    marginX,
    marginY,
    padding,
    paddingBottom,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingX,
    paddingY,
    marginUnit: marginUnit || spacingUnit,
    paddingUnit: paddingUnit || spacingUnit,
  });

  const userDefinedStyle = style || {};
  const groupItemStyle = {
    ...spacingStyle,
    ...userDefinedStyle,
    alignContent: alignContent || userDefinedStyle.alignContent,
    alignItems: alignItems || userDefinedStyle.alignItems,
    alignSelf: alignSelf || userDefinedStyle.alignSelf,
    flex: flexValue || userDefinedStyle.flex,
    justifyContent: justifyContent || userDefinedStyle.justifyContent,
  };

  const groupItemClassName = classNames(className, 'zen-group-item', {
    'zen-group-item--flex': flex,
    'zen-group-item--inline-block': inlineBlock,
  });

  return (
    <div
      className={groupItemClassName}
      style={groupItemStyle}
      data-testid={testId}
      ref={ref}
    >
      {children}
    </div>
  );
}

export default (React.forwardRef(Spacing): React.AbstractComponent<
  Props,
  React.ElementRef<'div'>,
>);
