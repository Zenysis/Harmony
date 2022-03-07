// @flow

/**
 * A NamedItem provides access to full name string that can be displayed by a
 * HierarchyItem.
 */
export interface NamedItem {
  name(): string;
  // NOTE(yitian): typing `any` here because tag is typed as a different string
  // literal in each ZenModel.
  tag?: any;
}

/**
 * A ShortNamedItem provides access to both a full name string and a short name
 * string that can be displayed when a more compact version of an item name
 * is needed.
 */
export interface ShortNamedItem extends NamedItem {
  shortName(): string;
}
