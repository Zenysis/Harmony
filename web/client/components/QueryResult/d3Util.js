const GEO_FIELD_ORDERING = window.__JSON_FROM_BACKEND.geoFieldOrdering;

function buildHierarchy(series, fieldId) {
  // Helper function to transform Zen frontend series data into the
  // hierarchical format that d3 expects.

  const root = {'name': 'root', 'children': []};
  for (let i = 0; i < series.length; i++) {
    const datapoint = series[i];
    const size = series[i][`yValue_${fieldId}`];
    if (size === 0) {
      // No need to represent this.
      continue;
    }
    const parts = GEO_FIELD_ORDERING.map(dim => datapoint[dim]).filter(x => !!x);
    let currentNode = root;
    for (let j = 0; j < parts.length; j++) {
      const children = currentNode.children;
      const nodeName = parts[j];
      let childNode;
      if (j + 1 < parts.length) {
        // Not yet at the end of the sequence; move down the tree.
        let foundChild = false;
        for (let k = 0; k < children.length; k++) {
          if (children[k].name === nodeName) {
            childNode = children[k];
            foundChild = true;
            break;
          }
        }
        // If we don't already have a child node for this branch, create it.
        if (!foundChild) {
          childNode = {'name': nodeName, 'children': []};
          children.push(childNode);
        }
        currentNode = childNode;
      } else {
        // Reached the end of the sequence; create a leaf node.
        childNode = {'name': nodeName, 'size': size};
        children.push(childNode);
      }
    }
  }
  return root;
}

/*
 * Check if `value` is an integer. isNaN(null) returns false, which is why this
 * function exists.
 */
function isInteger(value) {
  return typeof(value) === 'number';
}

/*
 * Adds the size of two nodes together. `a` and `b` can be null and undefined
 */
function _sizeAddition(a, b) {
  if (!isInteger(a)) {
    return b;
  }

  if (!isInteger(b)) {
    return a;
  }
  return a + b;
}

/*
 * Returns this node's size plus its children's.
 */
function getTotalSize(node) {
  if (node._cachedSize || node._cachedSize === null) {
    return node._cachedSize;
  }

  const size = node.size;
  let ret = isInteger(size) ? size : null;
  const children = node.children || node._children;

  if (children) {
    ret = children.reduce((acc, child) => {
      const childSum = getTotalSize(child);
      const sum = _sizeAddition(acc, childSum);
      return sum;
    }, size);
    node._cachedSize = ret;
  }

  return ret;
}

// Functions for wrapping svg <text> nodes into multiline versions that fit
// within the given width.
// Via: https://bl.ocks.org/mbostock/7555321
function wrapText(texts, width, fontSize) {
  const dy = 0;
  const lineHeight = 1.1; // ems

  texts.each(function createTspan() {
    const text = d3.select(this);
    const words = text.text().split(/\s+/).reverse();
    let word = '';
    let line = [];
    let lineNumber = 0;
    const x = text.attr('x');
    const y = text.attr('y');
    let tspan = text.text(null)
      .append('tspan')
      .attr('x', x)
      .attr('y', y)
      .attr('dy', dy + 'em')
      .style('font-size', fontSize);
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(' '));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(' '));
        line = [word];
        tspan = text.append('tspan')
                    .attr('x', x)
                    .attr('y', y)
                    .attr('dy', `${++lineNumber * lineHeight + dy}em`)
                    .text(word)
                    .style('font-size', fontSize);
      }
    }
  });
}

export default {
  buildHierarchy,
  getTotalSize,
  isInteger,
  wrapText
};
