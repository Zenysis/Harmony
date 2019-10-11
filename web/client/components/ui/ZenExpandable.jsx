import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import {
  getNodeRenderOptions,
  updateNode,
} from 'react-virtualized-tree/es/selectors/nodes';

const propTypes = {
  onChange: PropTypes.func.isRequired,
  onValueChange: PropTypes.func.isRequired,
  node: PropTypes.object.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
  selected: PropTypes.bool.isRequired,
};

// Based on
// https://github.com/diogofcunha/react-virtualized-tree/
// blob/master/src/renderers/Expandable.js
// We could have forked it, but this is easier and possibly more maintainable
const ZenExpandable = ({
  onChange,
  onValueChange,
  node,
  children,
  selected,
}) => {
  const iconsClassNameMap = {
    expanded: 'mi mi-keyboard-arrow-down',
    collapsed: 'mi mi-keyboard-arrow-right',
    lastChild: '',
  };

  const { hasChildren, isExpanded } = getNodeRenderOptions(node);
  let shouldRenderChildren = hasChildren;
  if (node.children && typeof (node.children[0]) === typeof ('')) {
    shouldRenderChildren = false;
  }

  const className = classNames({
    [iconsClassNameMap.expanded]: shouldRenderChildren && isExpanded,
    [iconsClassNameMap.collapsed]: shouldRenderChildren && !isExpanded,
    [iconsClassNameMap.lastChild]: !shouldRenderChildren,
  });

  const toggleExpand = (event) => {
    event.preventDefault();
    event.stopPropagation();

    // Stop other listeners of this same click event from propagating
    // This stops the dropdown from hiding.
    event.nativeEvent.stopImmediatePropagation();

    onChange(updateNode(node, { expanded: !isExpanded }));
  };

  const handleSelection = (event) => {
    event.preventDefault();
    event.stopPropagation();

    // Stop other listeners of this same click event from propagating
    // This stops the dropdown from hiding.
    event.nativeEvent.stopImmediatePropagation();

    onValueChange(node.id);
  };

  const indent = 30 * node.level;
  const style = {
    marginLeft: `${-indent}px`,
    paddingLeft: `${indent + 10}px`,
  };

  if (node.level === 0) {
    style.position = 'fixed';
  }

  if (node.level > 2) {
    style.display = 'none';
  }

  return (
    <span
      role="button"
      onClick={shouldRenderChildren
        ? toggleExpand
        : handleSelection
      }
      className="tree-node-inner"
      style={style}
    >
      <i className={className} />
      {children}
      {selected ?
        <i
          className="glyphicon glyphicon-ok tree-indicator-selected"
          aria-hidden="true"
        />
      : null}
    </span>
  );
};

ZenExpandable.propTypes = propTypes;

export default ZenExpandable;
