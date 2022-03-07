const invariant = require('invariant');
const path = require('path');

const { I18NFileTreeNode } = require('./I18NFileTreeNode');
const { I18N_FILENAME, I18N_TEMPLATE_FILEPATH } = require('../util/config');
const { fileExistsSync, readFile, writeFile } = require('../util/io');

/**
 * Represents a tree of i18n.js files. This way we can figure out which ones
 * should import which.  The root node is a placeholder root that points to the
 * `web/` directory. All children nodes thereafter are the top-level i18n.js
 * files.
 *
 * This tree cannot hold any duplicates, because there should never be
 * more than one i18n.js file per directory.
 */
class I18NFileTree {
  /**
   * Create an I18NFileTree from an array of file paths
   * @param {Array<string>} filepaths The filenames to use to make the I18NFileTree
   * @returns {I18NFileTree}
   */
  static fromFiles(filepaths) {
    const tree = new I18NFileTree();
    filepaths.forEach(filepath => {
      tree.addFile(filepath);
    });
    return tree;
  }

  constructor() {
    this.root = I18NFileTreeNode.makeRoot();

    // we use this for validation to make sure there are no duplicates
    this.filepaths = new Set();
  }

  /**
   * Add an i18n file to the tree.
   * @param {string} filepath The full i18n.js file path
   * @returns {void}
   */
  addFile(filepath) {
    if (filepath === this.root.filepath) {
      // if the filepath is the same as the root then we don't need to create a
      // new node
      return;
    }

    const basename = path.basename(filepath);
    invariant(
      basename === I18N_FILENAME,
      `Internal error creating I18NFileTree: tree can only hold files with name ${I18N_FILENAME}`,
    );
    invariant(
      !this.filepaths.has(filepath),
      `Internal error creating I18NFileTree: no duplicates allowed. Attempted to insert this file more than once: ${filepath}`,
    );

    const nodeToAdd = new I18NFileTreeNode(filepath);
    this.filepaths.add(filepath);

    const nodesToExplore = [this.root];
    while (nodesToExplore.length > 0) {
      const currentNode = nodesToExplore.pop();
      if (nodeToAdd.isDirectAncestorOf(currentNode)) {
        currentNode.updateParent(nodeToAdd);
      } else if (nodeToAdd.isDirectDescendentOf(currentNode)) {
        const ancestors = currentNode.findDirectAncestorsOf(nodeToAdd);

        if (ancestors.length === 0) {
          currentNode.addChildAndMoveDescendents(nodeToAdd);
        } else {
          ancestors.forEach(ancestor => {
            nodesToExplore.push(ancestor);
          });
        }

        continue;
      }

      throw new Error(
        'Internal error creating I18NFileTree: unreachable code.',
      );
    }
  }

  /**
   * Depth-first traversal of the I18N tree. Calls `callback` on every node.
   *
   * @param {(node: I18NFileTreeNode, depth: number) => void} callback The function
   * to call on every node. Takes a `node` and a `depth` as arguments.
   * @returns {void}
   */
  traverse(callback) {
    const nodesToExplore = [{ n: this.root, depth: 0 }];
    while (nodesToExplore.length > 0) {
      const { n, depth } = nodesToExplore.pop();
      callback(n, depth);

      // we're using a stack, so iterate over children in reverse order
      // to make sure we end up processing children in the correct order
      const children = n.getChildren();
      for (let i = children.length - 1; i >= 0; i--) {
        nodesToExplore.push({ n: children[i], depth: depth + 1 });
      }
    }
  }

  /**
   * Return the tree as a string, for debugging
   * @returns string
   */
  toString() {
    const lines = [];
    this.traverse((node, depth) => {
      const tabs = '\t'.repeat(depth);
      lines.push(`${tabs}${node.getRelativePath()}`);
    });
    return lines.join('\n');
  }

  /**
   * Write the i18n root file
   * @returns {Promise<boolean>} True if the root has changed, false otherwise
   */
  writeRoot() {
    const rootPath = this.root.filepath;
    if (fileExistsSync(rootPath)) {
      return this.root.updateImportsInFile();
    }

    return readFile(I18N_TEMPLATE_FILEPATH)
      .then(templateContents => writeFile(rootPath, templateContents))
      .then(() => this.root.updateImportsInFile());
  }
}

module.exports = I18NFileTree;
