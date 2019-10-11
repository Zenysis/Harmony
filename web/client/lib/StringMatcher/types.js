// @flow

export type SearchTerms = $ReadOnlyArray<string>;

// NOTE(stephen): Position coordinates are *inclusive*.
export type Position = [number, number];
export type PositionArray = $ReadOnlyArray<Position>;
