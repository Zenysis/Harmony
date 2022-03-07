/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type UnpublishedFieldRow_pipelineDatasourceConnection$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type UnpublishedFieldTableRows_pipelineDatasourceConnection$ref: FragmentReference;
declare export opaque type UnpublishedFieldTableRows_pipelineDatasourceConnection$fragmentType: UnpublishedFieldTableRows_pipelineDatasourceConnection$ref;
export type UnpublishedFieldTableRows_pipelineDatasourceConnection = {|
  +$fragmentRefs: UnpublishedFieldRow_pipelineDatasourceConnection$ref,
  +$refType: UnpublishedFieldTableRows_pipelineDatasourceConnection$ref,
|};
export type UnpublishedFieldTableRows_pipelineDatasourceConnection$data = UnpublishedFieldTableRows_pipelineDatasourceConnection;
export type UnpublishedFieldTableRows_pipelineDatasourceConnection$key = {
  +$data?: UnpublishedFieldTableRows_pipelineDatasourceConnection$data,
  +$fragmentRefs: UnpublishedFieldTableRows_pipelineDatasourceConnection$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "UnpublishedFieldTableRows_pipelineDatasourceConnection",
  "selections": [
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "UnpublishedFieldRow_pipelineDatasourceConnection"
    }
  ],
  "type": "pipeline_datasourceConnection",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = '45794356fb3de0f7ed47c36873f4ec8b';

export default node;
