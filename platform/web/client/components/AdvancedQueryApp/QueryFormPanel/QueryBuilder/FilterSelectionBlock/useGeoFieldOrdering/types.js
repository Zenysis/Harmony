// @flow
import * as Zen from 'lib/Zen';

/**
 * A mapping from a geo dimension filter to a list of selected values for
 * that dimension
 */
export type GeoDimensionFilterMap = Zen.Map<Set<string>>;
