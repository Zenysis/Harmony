// @flow
// This defines how a group of testable items will be combined.
// - INTERSECT: Every item in the group must pass for the entire group to pass.
// - UNION: If any item in the group passes, the entire group passes.
export type SetOperation = 'INTERSECT' | 'UNION';
