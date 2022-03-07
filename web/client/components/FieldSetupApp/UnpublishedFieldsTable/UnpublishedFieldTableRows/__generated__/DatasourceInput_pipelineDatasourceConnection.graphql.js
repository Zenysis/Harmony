/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
import type { FragmentReference } from "relay-runtime";
declare export opaque type DatasourceInput_pipelineDatasourceConnection$ref: FragmentReference;
declare export opaque type DatasourceInput_pipelineDatasourceConnection$fragmentType: DatasourceInput_pipelineDatasourceConnection$ref;
export type DatasourceInput_pipelineDatasourceConnection = {|
  +edges: $ReadOnlyArray<{|
    +node: {|
      +id: string,
      +name: string,
    |}
  |}>,
  +$refType: DatasourceInput_pipelineDatasourceConnection$ref,
|};
export type DatasourceInput_pipelineDatasourceConnection$data = DatasourceInput_pipelineDatasourceConnection;
export type DatasourceInput_pipelineDatasourceConnection$key = {
  +$data?: DatasourceInput_pipelineDatasourceConnection$data,
  +$fragmentRefs: DatasourceInput_pipelineDatasourceConnection$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "DatasourceInput_pipelineDatasourceConnection",
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "pipeline_datasourceEdge",
      "kind": "LinkedField",
      "name": "edges",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "pipeline_datasource",
          "kind": "LinkedField",
          "name": "node",
          "plural": false,
          "selections": [
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "id",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "name",
              "storageKey": null
            }
          ],
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "pipeline_datasourceConnection",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = '80196caa86749c2ef5667d3da38bc8c2';

export default node;
