/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
import type { FragmentReference } from "relay-runtime";
declare export opaque type UpdateDatasourceAction_pipelineDatasourceConnection$ref: FragmentReference;
declare export opaque type UpdateDatasourceAction_pipelineDatasourceConnection$fragmentType: UpdateDatasourceAction_pipelineDatasourceConnection$ref;
export type UpdateDatasourceAction_pipelineDatasourceConnection = {|
  +edges: $ReadOnlyArray<{|
    +node: {|
      +id: string,
      +name: string,
    |}
  |}>,
  +$refType: UpdateDatasourceAction_pipelineDatasourceConnection$ref,
|};
export type UpdateDatasourceAction_pipelineDatasourceConnection$data = UpdateDatasourceAction_pipelineDatasourceConnection;
export type UpdateDatasourceAction_pipelineDatasourceConnection$key = {
  +$data?: UpdateDatasourceAction_pipelineDatasourceConnection$data,
  +$fragmentRefs: UpdateDatasourceAction_pipelineDatasourceConnection$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "UpdateDatasourceAction_pipelineDatasourceConnection",
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
(node/*: any*/).hash = '161cfdf14ba3f46b6e0ad0d096e6a4e1';

export default node;
