/**
 * This file tests the `I18NFileTree` class.
 */
const I18NFileTree = require('../I18NFileTree');
const { I18NFileTreeNode } = require('../I18NFileTreeNode');

const ROOT = 'web/client/i18n.js';

// make a full absolute path including `web/client` in it
function makeFullFilePath(path) {
  return `${process.cwd()}/web/client/${path}`;
}

// get the filepaths from an array of I18NFileTreeNodes
function filepaths(nodes) {
  return nodes.map(n => n.filepath);
}

function treeToLines(tree) {
  return tree.toString().split('\n');
}

describe('i18n generator: I18NFileTree', () => {
  test('Create a tree with only the root', () => {
    const tree = I18NFileTree.fromFiles([]);
    expect(tree.root.filepath).toBe(I18NFileTreeNode.makeRoot().filepath);
    expect(tree.root.children).toEqual([]);
  });

  test('Create a tree with one child', () => {
    const filenames = ['a/b/c/i18n.js'].map(makeFullFilePath);
    const tree = I18NFileTree.fromFiles(filenames);
    expect(filepaths(tree.root.children)).toEqual(filenames);
  });

  test('Create a tree with 1 layer of children', () => {
    const filenames = ['a/i18n.js', 'b/i18n.js'].map(makeFullFilePath);
    const tree = I18NFileTree.fromFiles(filenames);
    expect(filepaths(tree.root.children)).toEqual(filenames);
  });

  test('Create a single-branch tree with nodes not coming in the same order', () => {
    const filenames = [
      'a/i18n.js',
      'a/x/xx/i18n.js',
      'a/x/i18n.js', // parent of `a/x/xx`
      'a/x/xy/i18n.js', // sibling of `a/x/xx`
    ].map(makeFullFilePath);
    const tree = I18NFileTree.fromFiles(filenames);

    // test the first layer
    const firstLayer = tree.root.children;
    expect(filepaths(firstLayer)).toEqual([makeFullFilePath('a/i18n.js')]);

    // test the second layer
    const secondLayer = firstLayer.flatMap(n => n.children);
    expect(filepaths(secondLayer)).toEqual([makeFullFilePath('a/x/i18n.js')]);

    // test the third layer
    const thirdLayer = secondLayer.flatMap(n => n.children);
    expect(filepaths(thirdLayer)).toEqual(
      ['a/x/xx/i18n.js', 'a/x/xy/i18n.js'].map(makeFullFilePath),
    );
  });

  test('Create a multi-branch tree', () => {
    const filenames = [
      'a/i18n.js',
      'b/i18n.js',
      'a/x/xx/i18n.js',
      'c/i18n.js',
      'a/x/i18n.js',
      'a/x/xy/i18n.js',
      'b/x/i18n.js',
    ].map(makeFullFilePath);
    const tree = I18NFileTree.fromFiles(filenames);

    // test the first layer
    const firstLayer = tree.root.children;
    expect(filepaths(firstLayer)).toEqual(
      ['a/i18n.js', 'b/i18n.js', 'c/i18n.js'].map(makeFullFilePath),
    );

    // test the second layer
    const secondLayer = firstLayer.flatMap(n => n.children);
    expect(filepaths(secondLayer)).toEqual(
      ['a/x/i18n.js', 'b/x/i18n.js'].map(makeFullFilePath),
    );

    // test the third layer
    const thirdLayer = secondLayer.flatMap(n => n.children);
    expect(filepaths(thirdLayer)).toEqual(
      ['a/x/xx/i18n.js', 'a/x/xy/i18n.js'].map(makeFullFilePath),
    );
  });

  test('Traverse a multi-branch tree in expected depth-first order', () => {
    const filenames = [
      'a/i18n.js',
      'b/i18n.js',
      'a/x/xx/i18n.js',
      'c/i18n.js',
      'a/x/i18n.js',
      'a/x/xy/i18n.js',
      'b/x/i18n.js',
    ].map(makeFullFilePath);
    const tree = I18NFileTree.fromFiles(filenames);

    expect(treeToLines(tree)).toEqual([
      ROOT,
      '\tweb/client/a/i18n.js',
      '\t\tweb/client/a/x/i18n.js',
      '\t\t\tweb/client/a/x/xx/i18n.js',
      '\t\t\tweb/client/a/x/xy/i18n.js',
      '\tweb/client/b/i18n.js',
      '\t\tweb/client/b/x/i18n.js',
      '\tweb/client/c/i18n.js',
    ]);
  });
});
