// @flow

// Create a unique category id for new categories created through data catalog.
export function createUniqueCategoryId(): string {
  return `custom_category_${+new Date()}`;
}
