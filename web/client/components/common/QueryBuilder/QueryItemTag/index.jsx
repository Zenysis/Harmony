// @flow
import * as React from 'react';

import DragHandle from 'components/ui/DraggableItem/DragHandle';
import Tag from 'components/ui/Tag';
import { noop } from 'util/util';
import type { IconType } from 'components/ui/Icon/types';
import type { TagSize } from 'components/ui/Tag';

type DefaultProps<T> = {
  className: string,
  clickable: boolean,
  disabled: boolean,
  iconType: IconType | void,
  onRemoveTagClick: (
    value: T,
    event: SyntheticMouseEvent<HTMLSpanElement>,
  ) => void,
  onTagClick: (item: T) => void,
  removable: boolean,
  showDragHandle: boolean,
  tagSize: TagSize,
};

type Props<T> = {
  ...DefaultProps<T>,
  item: T,
  text: React.Node,
};

// NOTE(stephen): I wanted to make this a functional component, but
// React.memo does not work here because Props is generic.
export default class QueryItemTag<T> extends React.PureComponent<Props<T>> {
  static defaultProps: DefaultProps<T> = {
    className: '',
    clickable: true,
    disabled: false,
    iconType: undefined,
    onRemoveTagClick: noop,
    onTagClick: noop,
    removable: true,
    showDragHandle: true,
    tagSize: Tag.Sizes.SMALL,
  };

  maybeRenderDragHandle(): React.Node {
    const { showDragHandle, disabled, iconType } = this.props;
    if (showDragHandle) {
      return (
        <DragHandle
          className="query-item-tag__icon"
          disabled={disabled}
          iconType={iconType}
          size="medium"
        />
      );
    }
    return null;
  }

  render(): React.Node {
    const {
      className,
      clickable,
      disabled,
      item,
      onRemoveTagClick,
      onTagClick,
      removable,
      text,
      tagSize,
    } = this.props;
    return (
      <Tag
        ariaName={typeof text === 'string' ? text : undefined}
        className={`query-item-tag ${className}`}
        onClick={!disabled && clickable ? onTagClick : undefined}
        onRequestRemove={!disabled && removable ? onRemoveTagClick : undefined}
        removable={!disabled && removable}
        size={tagSize}
        value={item}
      >
        {this.maybeRenderDragHandle()}
        <div className="query-item-tag__text">{text}</div>
      </Tag>
    );
  }
}
