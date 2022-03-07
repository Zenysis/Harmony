// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import QueryResultSpec from 'models/core/QueryResultSpec';
import QuerySelections from 'models/core/wip/QuerySelections';
import SettingsModal from 'components/visualizations/common/SettingsModal';
import { TEST_FIELDS_MAP } from 'services/wip/__mocks__/FieldService';

type Props = {
  initialQueryResultSpec?: QueryResultSpec,
  initialSelections?: QuerySelections,
};

export const INITIAL_QUERY_SELECTIONS: QuerySelections = QuerySelections.create(
  {
    fields: Zen.Array.create([TEST_FIELDS_MAP.FIELD_1]),
    filter: Zen.Array.create(),
    groups: Zen.Array.create(),
  },
);

export const TWO_FIELD_QUERY_SELECTIONS: QuerySelections = QuerySelections.create(
  {
    fields: Zen.Array.create([
      TEST_FIELDS_MAP.FIELD_1,
      TEST_FIELDS_MAP.FIELD_2,
    ]),
    filter: Zen.Array.create(),
    groups: Zen.Array.create(),
  },
);

export default function SettingsModalWrapper({
  initialSelections,
  initialQueryResultSpec,
}: Props): React.Element<typeof SettingsModal> {
  const [queryResultSpec, setQueryResultSpec] = React.useState<QueryResultSpec>(
    () =>
      initialQueryResultSpec ||
      QueryResultSpec.fromQuerySelections(
        ['TABLE'],
        initialSelections || INITIAL_QUERY_SELECTIONS,
      ),
  );

  return (
    <SettingsModal
      show
      onQueryResultSpecChange={setQueryResultSpec}
      onRequestClose={() => undefined}
      queryResultSpec={queryResultSpec}
      querySelections={INITIAL_QUERY_SELECTIONS}
      viewType="TABLE"
    />
  );
}
