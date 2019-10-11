// @flow

/**
 * A NamedItem provides access to full name string that can be displayed by a
 * HierarchyItem.
 */
export interface NamedItem {
  name(): string;
}

/**
 * A ShortNamedItem provides access to both a full name string and a short name
 * string that can be displayed when a more compact version of an item name
 * is needed.
 */
export interface ShortNamedItem {
  name(): string;
  shortName(): string;
}
