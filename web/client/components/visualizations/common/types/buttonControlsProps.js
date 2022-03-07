// @flow
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

// NOTE(nina): These are the props used for the Query Result Action Buttons,
// which are used in AQT and the Grid Dashboard
export type ButtonControlsProps = {
  onOpenSettingsModalClick: () => void,
  onQueryResultSpecChange: QueryResultSpec => void,
  querySelections: QuerySelections,
  viewType: ResultViewType,
};
