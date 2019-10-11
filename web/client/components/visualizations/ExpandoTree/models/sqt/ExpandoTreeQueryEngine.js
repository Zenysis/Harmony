// @flow
import * as Zen from 'lib/Zen';
import ExpandoTreeQueryEngine from 'components/visualizations/ExpandoTree/models/aqt/ExpandoTreeQueryEngine';
import ExpandoTreeQueryResultData from 'components/visualizations/ExpandoTree/models/ExpandoTreeQueryResultData';
import SimpleQuerySelectionsUtil from 'models/core/SimpleQuerySelections/SimpleQuerySelectionsUtil';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import type { QueryEngine } from 'models/core/QueryResultState/interfaces/QueryEngine';

// NOTE(stephen): SQT ExpandoTree uses AQT's QueryEngine and endpoints to
// produce results.
class SQTExpandoTreeQueryEngine
  implements
    QueryEngine<
      SimpleQuerySelections,
      Zen.Serialized<ExpandoTreeQueryResultData>,
    > {
  // eslint-disable-next-line class-methods-use-this
  run(
    querySelections: SimpleQuerySelections,
    queryResultSpec: QueryResultSpec,
  ): Promise<Zen.Serialized<ExpandoTreeQueryResultData>> {
    // Convert to the new QuerySelections type and run the query using the AQT
    // endpoint.
    return SimpleQuerySelectionsUtil.castToQuerySelections(
      querySelections,
    ).then((fullSelections: QuerySelections) =>
      ExpandoTreeQueryEngine.run(fullSelections, queryResultSpec),
    );
  }
}

export default new SQTExpandoTreeQueryEngine();
