const path = require('path');

const { I18N_FILENAME, I18N_ROOT } = require('../util/config');
const { updateI18NImports } = require('./updateI18NImports');

const ROOT_PATH = `${process.cwd()}/${I18N_ROOT}/${I18N_FILENAME}`;

/**
 * Represents a single i18n.js file, and which files it should import from (its
 * children), and which file imports it (its parent).
 */
class I18NFileTreeNode {
  static makeRoot() {
    return new I18NFileTreeNode(ROOT_PATH);
  }

  /**
   * @param {string} filepath The full file path represented by this node
   */
  constructor(filepath) {
    this.filepath = filepath;
    this.dir = path.dirname(filepath);
    this.parent = undefined;
    this.children = [];
  }

  /**
   * Directly set the parent of this node to be `parent`.
   * This will not update any siblings.
   * @param {I18NFileTreeNode | void} parent The new node to set as the parent
   */
  _forceSetParent(parent) {
    this.parent = parent;
  }

  /**
   * Directly set the children of this node to be `children`.
   * This will not update any siblings or parents.
   * @param {Array<I18NFileTreeNode>} children The new array to set as the
   * children.
   */
  _forceSetChildren(children) {
    this.children = children;
  }

  getParent() {
    return this.parent;
  }

  getChildren() {
    return this.children;
  }

  /**
   * Get the directory relative to the current working directory
   */
  getRelativePath() {
    return path.relative(process.cwd(), this.filepath);
  }

  /**
   * Get all children that are direct ancestors of a given node.
   * @param {I18NFileTreeNode} node The node we want to test against.
   * @returns {Array<I18NFileTreeNode>}
   */
  findDirectAncestorsOf(node) {
    return this.children.filter(child => child.isDirectAncestorOf(node));
  }

  /**
   * Check if this node is a direct descendent of another node.
   * For example, let's say the current node is `web/client/A/B/C/D/i18n.js`
   * If `otherNode` is `web/client/A/i18n.js` then we return `true`.
   * If `otherNode` is `web/client/A/E/i18n.js` then we return `false`, because
   * the current node cannot be found inside that directory.
   * @param {I18NFileTreeNode} otherNode The node to check that we are a
   * descendent of
   */
  isDirectDescendentOf(otherNode) {
    if (otherNode.isRoot()) {
      return true;
    }

    const relativePath = path.relative(otherNode.dir, this.dir);
    if (relativePath === '') {
      return false;
    }

    // if we could travel from `otherNode.dir` to this one without ever having
    // to move back a directory, then we are a direct descendent of `otherNode`
    return !relativePath.includes('..');
  }

  /**
   * Check if this node is a direct ancestor of another node.
   * For example, let's say the current node is `web/client/A/B/i18n.js`
   * If `otherNode` is `web/client/A/i18n.js` then we return `false`.
   * If `otherNode` is `web/client/A/B/C/D/i18.js` then we return `true`.
   * @param {I18NFileTreeNode} otherNode The node to check that we are an
   * ancestor of
   */
  isDirectAncestorOf(otherNode) {
    return otherNode.isRoot() ? false : otherNode.isDirectDescendentOf(this);
  }

  /**
   * Safely update the parent of this node to point to the passed `newParent`.
   * This will also change all the siblings of this node to also point back
   * to `newParent`.
   * @param {I18NFileTreeNode} newParent The new node to set as the parent
   */
  updateParent(newParent) {
    if (this.parent !== undefined) {
      const oldParent = this.parent;
      const oldChildren = oldParent.getChildren();
      oldParent.unlinkChildren();
      oldParent.addChild(newParent);

      // all siblings should also point to the newParent
      oldChildren.forEach(sibling => {
        newParent.addChild(sibling);
      });
    } else {
      newParent.addChild(this);
    }
  }

  unlinkChildren() {
    this.children.forEach(child => child._forceSetParent(undefined));
    this.children = [];
  }

  /**
   * @param {I18NFileTreeNode} node The child to add
   */
  addChild(node) {
    node._forceSetParent(this);
    this.children.push(node);
  }

  /**
   * Add a child to this node. If this node already has children that are
   * descendents of `nodeToAdd`, then move those nodes to go under `nodeToAdd`
   * instead.
   *
   * @param {I18NFileTreeNode} node The child to add
   */
  addChildAndMoveDescendents(nodeToAdd) {
    const newChildren = [];
    this.getChildren().forEach(child => {
      if (child.isDirectDescendentOf(nodeToAdd)) {
        nodeToAdd.addChild(child);
      } else {
        newChildren.push(child);
      }
    });
    this._forceSetChildren(newChildren);
    this.addChild(nodeToAdd);
  }

  /**
   * @returns boolean
   */
  isLeaf() {
    return this.children.length === 0;
  }

  /**
   * @returns boolean
   */
  isRoot() {
    return this.filepath === ROOT_PATH;
  }

  /**
   * Update an i18n.js file's imports.
   * @returns {Promise<boolean>} True if the file has changed, false otherwise
   */
  updateImportsInFile() {
    return updateI18NImports(
      this.filepath,
      this.children.map(n => n.filepath),
    );
  }
}

module.exports = {
  ROOT_PATH,
  I18NFileTreeNode,
};
