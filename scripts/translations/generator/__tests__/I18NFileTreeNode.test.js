/**
 * This file tests the `I18NFileTreeNode` class and its public functions.
 */
const { I18NFileTreeNode, ROOT_PATH } = require('../I18NFileTreeNode');

// make a full absolute path including `web/client` in it
function makeFullFilePath(path) {
  return `${process.cwd()}/web/client/${path}`;
}

function makeNode(path) {
  return new I18NFileTreeNode(makeFullFilePath(path));
}

describe('i18n generator: I18NFileTreeNode', () => {
  test("getRelativePath: a node's relative path is calculated correctly", () => {
    const node = makeNode('a/b/i18n.js').getRelativePath();
    expect(node).toBe('web/client/a/b/i18n.js');
  });

  test('findDirectAncestorsOf', () => {
    const parent = makeNode('a/i18n.js');
    const child1 = makeNode('a/xx/b/i18n.js');
    const child2 = makeNode('a/xx/c/i18n.js');
    parent.addChild(child1);
    parent.addChild(child2);

    const testNode = makeNode('a/xx/b/c/d/e/i18n.js');
    expect(parent.findDirectAncestorsOf(testNode)).toEqual([child1]);
  });

  test('findDirectAncestorsOf: no ancestors found', () => {
    const parent = makeNode('a/i18n.js');
    const child1 = makeNode('a/xx/b/i18n.js');
    const child2 = makeNode('a/xx/c/i18n.js');
    parent.addChild(child1);
    parent.addChild(child2);

    const testNode = makeNode('a/xx/d/e/f/i18n.js');
    expect(parent.findDirectAncestorsOf(testNode)).toEqual([]);
  });

  test('isDirectDescendentOf', () => {
    const node1 = makeNode('a/i18n.js');
    const node2 = makeNode('a/x/xx/xxx/i18n.js');
    expect(node1.isDirectDescendentOf(node2)).toBe(false);
    expect(node2.isDirectDescendentOf(node1)).toBe(true);
  });

  test('isDirectDescendentOf: returns false for nodes at the same level', () => {
    const node1 = makeNode('a/i18n.js');
    const node2 = makeNode('a/i18n.js');
    expect(node1.isDirectAncestorOf(node2)).toBe(false);
    expect(node2.isDirectAncestorOf(node1)).toBe(false);
  });

  test('isDirectAncestorOf', () => {
    const node1 = makeNode('a/i18n.js');
    const node2 = makeNode('a/x/xx/xxx/i18n.js');
    expect(node1.isDirectAncestorOf(node2)).toBe(true);
    expect(node2.isDirectAncestorOf(node1)).toBe(false);
  });

  test('isDirectAncestorOf: returns false for nodes at the same level', () => {
    const node1 = makeNode('a/i18n.js');
    const node2 = makeNode('a/i18n.js');
    expect(node1.isDirectAncestorOf(node2)).toBe(false);
    expect(node2.isDirectAncestorOf(node1)).toBe(false);
  });

  test('updateParent: updates parent of a parentless node', () => {
    const parent = makeNode('a/i18n.js');
    const child1 = makeNode('a/xx/b/i18n.js');
    child1.updateParent(parent);
    expect(parent.getChildren()).toEqual([child1]);
    expect(child1.getParent()).toBe(parent);
  });

  test('updateParent: updates parent and siblings of a node that already has a parent', () => {
    const parent = makeNode('a/i18n.js');
    const child1 = makeNode('a/xx/b/i18n.js');
    const child2 = makeNode('a/xx/c/i18n.js');
    parent.addChild(child1);
    parent.addChild(child2);

    // update child1's parent to be `newParent`
    const newParent = makeNode('a/xx/i18n.js');
    child1.updateParent(newParent);

    // this should have updated child2's parent as well, because they are
    // siblings
    expect(newParent.getChildren()).toEqual([child1, child2]);
    expect(child1.getParent()).toBe(newParent);
    expect(child2.getParent()).toBe(newParent);

    // old parent's child should be the new child
    expect(parent.getChildren()).toEqual([newParent]);

    // new parent's parent should be the old parent
    expect(newParent.getParent()).toBe(parent);
  });

  test("addChild: child gets added, and child's parent is updated", () => {
    const parent = makeNode('a/i18n.js');
    const child1 = makeNode('a/b/i18n.js');
    const child2 = makeNode('a/c/i18n.js');
    parent.addChild(child1);
    parent.addChild(child2);
    expect(parent.getChildren()).toEqual([child1, child2]);
    expect(child1.getParent()).toBe(parent);
    expect(child2.getParent()).toBe(parent);
  });

  test('addChildAndMoveDescendents: child gets added to a parent, and any descendents get moved under the new child', () => {
    const parent = makeNode('a/i18n.js');
    const child1 = makeNode('a/x/i18n.js');
    const child2 = makeNode('a/x/xx/xxx/i18n.js');
    parent.addChild(child1);
    parent.addChild(child2);

    // child2 should get moved to go under `newChild`
    const newChild = makeNode('a/x/xx/i18n.js');
    parent.addChildAndMoveDescendents(newChild);
    expect(child1.getParent()).toBe(parent); // child1 parent doesnt change
    expect(child2.getParent()).toBe(newChild); // parent changed
    expect(newChild.getChildren()).toEqual([child2]);
  });

  test('isLeaf: returns true for a leaaf node', () => {
    const node = makeNode('a/i18n.js');
    expect(node.isLeaf()).toBe(true);
  });

  test('isLeaf: returns false for a non-leaf', () => {
    const node = makeNode('a/i18n.js');
    const child1 = makeNode('a/b/i18n.js');
    const child2 = makeNode('a/c/i18n.js');
    node.addChild(child1);
    node.addChild(child2);
    expect(node.isLeaf()).toBe(false);
  });

  test('isRoot: returns true for root node', () => {
    const node = new I18NFileTreeNode(ROOT_PATH);
    return expect(node.isRoot()).toBe(true);
  });

  test('isRoot: returns false for a non-root node', () => {
    const node = makeNode('some/random/path/i18n.js');
    return expect(node.isRoot()).toBe(false);
  });
});
