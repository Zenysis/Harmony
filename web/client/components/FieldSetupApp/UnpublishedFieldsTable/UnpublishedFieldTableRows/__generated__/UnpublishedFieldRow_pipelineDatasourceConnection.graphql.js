/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type DatasourceInput_pipelineDatasourceConnection$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type UnpublishedFieldRow_pipelineDatasourceConnection$ref: FragmentReference;
declare export opaque type UnpublishedFieldRow_pipelineDatasourceConnection$fragmentType: UnpublishedFieldRow_pipelineDatasourceConnection$ref;
export type UnpublishedFieldRow_pipelineDatasourceConnection = {|
  +$fragmentRefs: DatasourceInput_pipelineDatasourceConnection$ref,
  +$refType: UnpublishedFieldRow_pipelineDatasourceConnection$ref,
|};
export type UnpublishedFieldRow_pipelineDatasourceConnection$data = UnpublishedFieldRow_pipelineDatasourceConnection;
export type UnpublishedFieldRow_pipelineDatasourceConnection$key = {
  +$data?: UnpublishedFieldRow_pipelineDatasourceConnection$data,
  +$fragmentRefs: UnpublishedFieldRow_pipelineDatasourceConnection$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "UnpublishedFieldRow_pipelineDatasourceConnection",
  "selections": [
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "DatasourceInput_pipelineDatasourceConnection"
    }
  ],
  "type": "pipeline_datasourceConnection",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = 'e11e8cd1a148dab98d4798eac42ac0ee';

export default node;
