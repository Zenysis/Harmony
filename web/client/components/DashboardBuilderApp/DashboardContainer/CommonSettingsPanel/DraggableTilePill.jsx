// @flow
import * as React from 'react';

import DragHandle from 'components/ui/DraggableItem/DragHandle';
import Tag from 'components/ui/Tag';
import type { SVGType } from 'components/ui/Icon/internal/SVGs';

type Props = {
  icon: SVGType,
  text: string,
};

/**
 * The DraggableTilePill provides a component that will act as a general
 * draggable item to add elements to a dashboard.
 */
function DraggableTilePill({ icon, text }: Props) {

  const pillIcon = (
    <DragHandle
        className="gd-draggable-tile-pill-tag__icon"
        iconType={icon}
        size="large"
    />
  )

  return (
    <Tag
      ariaName="draggable-tile-pill"
      className="gd-draggable-tile-pill-tag"
      onClick={undefined} //TODO(kalyani): modify onClick to add draggability
      size="medium"
      value={undefined}
    >
      <div className="gd-draggable-tile-pill-tag__content-container">
        {pillIcon}
        <div className="gd-draggable-tile-pill-tag__text">{text}</div>
      </div>
    </Tag>
  );
}

export default (React.memo(DraggableTilePill): React.AbstractComponent<Props>);
