/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
import type { FragmentReference } from "relay-runtime";
declare export opaque type DataprepSetUp_pipelineDatasourceConnection$ref: FragmentReference;
declare export opaque type DataprepSetUp_pipelineDatasourceConnection$fragmentType: DataprepSetUp_pipelineDatasourceConnection$ref;
export type DataprepSetUp_pipelineDatasourceConnection = {|
  +edges: $ReadOnlyArray<{|
    +node: {|
      +id: string,
      +name: string,
    |}
  |}>,
  +$refType: DataprepSetUp_pipelineDatasourceConnection$ref,
|};
export type DataprepSetUp_pipelineDatasourceConnection$data = DataprepSetUp_pipelineDatasourceConnection;
export type DataprepSetUp_pipelineDatasourceConnection$key = {
  +$data?: DataprepSetUp_pipelineDatasourceConnection$data,
  +$fragmentRefs: DataprepSetUp_pipelineDatasourceConnection$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "DataprepSetUp_pipelineDatasourceConnection",
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
(node/*: any*/).hash = '8b26ccb04e6a1cb718c362931dd84416';

export default node;
