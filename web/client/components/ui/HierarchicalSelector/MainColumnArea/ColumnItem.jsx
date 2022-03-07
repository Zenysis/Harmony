// @flow
import * as React from 'react';
import classNames from 'classnames';

import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import InfoTooltip from 'components/ui/InfoTooltip';
import autobind from 'decorators/autobind';
import type { NamedItem } from 'models/ui/HierarchicalSelector/types';

const TEXT = t('ui.HierarchicalSelector.MainColumnArea.ColumnItem');

type DefaultProps = {
  isActive: boolean,
  isUnselectable: boolean,
};

type Props<T> = {
  ...DefaultProps,
  hierarchyItem: HierarchyItem<T>,
  onClick: (item: HierarchyItem<T>, event: SyntheticEvent<HTMLElement>) => void,
};

export default class ColumnItem<T: NamedItem> extends React.PureComponent<
  Props<T>,
> {
  static defaultProps: DefaultProps = {
    isActive: false,
    isUnselectable: false,
  };

  @autobind
  onClick(event: SyntheticEvent<HTMLElement>) {
    this.props.onClick(this.props.hierarchyItem, event);
  }

  maybeRenderAngleIcon(): React.Node {
    const { hierarchyItem } = this.props;
    if (hierarchyItem.isCategoryItem()) {
      const className = classNames(
        'hierarchy-column-item__angle-icon',
        'glyphicon glyphicon-menu-right',
      );
      return <i className={className} />;
    }
    return null;
  }

  maybeRenderMRUTooltip(): React.Node {
    const { hierarchyItem } = this.props;
    // TODO(pablo, toshi): expecting an '_mru' id is business-logic dependent
    // and is unpredictable behavior by just reading the HierarchicalSelector's
    // props. Make this more generic so user's can know how to work with MRU
    // items
    if (hierarchyItem.id() === '__mru') {
      return <InfoTooltip iconType="time" text={TEXT.mruTooltip} />;
    }

    return null;
  }

  render(): React.Element<'div'> {
    const { isActive, hierarchyItem, isUnselectable } = this.props;
    const labelClassName = classNames('hierarchy-column-item__label', {
      'hierarchy-column-item__label--leaf': hierarchyItem.isLeafItem(),
    });

    const className = classNames('hierarchy-column-item', {
      'hierarchy-column-item--active': isActive,
      'hierarchy-column-item--unselectable': isUnselectable,
    });

    return (
      <div
        title={hierarchyItem.name()}
        role="menuitem"
        className={className}
        onClick={!isUnselectable ? this.onClick : undefined}
      >
        <span className={labelClassName}>
          {hierarchyItem.shortName()}
          {this.maybeRenderMRUTooltip()}
        </span>
        {this.maybeRenderAngleIcon()}
      </div>
    );
  }
}
