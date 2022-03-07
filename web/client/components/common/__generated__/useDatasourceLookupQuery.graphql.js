/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
export type useDatasourceLookupQueryVariables = {||};
export type useDatasourceLookupQueryResponse = {|
  +pipelineDatasourceConnection: {|
    +edges: $ReadOnlyArray<{|
      +node: {|
        +id: string,
        +name: string,
      |}
    |}>
  |}
|};
export type useDatasourceLookupQuery = {|
  variables: useDatasourceLookupQueryVariables,
  response: useDatasourceLookupQueryResponse,
|};
*/


/*
query useDatasourceLookupQuery {
  pipelineDatasourceConnection: pipeline_datasource_connection {
    edges {
      node {
        id
        name
      }
    }
  }
}
*/

const node/*: ConcreteRequest*/ = (function(){
var v0 = [
  {
    "alias": "pipelineDatasourceConnection",
    "args": null,
    "concreteType": "pipeline_datasourceConnection",
    "kind": "LinkedField",
    "name": "pipeline_datasource_connection",
    "plural": false,
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
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "useDatasourceLookupQuery",
    "selections": (v0/*: any*/),
    "type": "query_root",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "useDatasourceLookupQuery",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "63c8b62165c83a008e1102ae9df97020",
    "id": null,
    "metadata": {},
    "name": "useDatasourceLookupQuery",
    "operationKind": "query",
    "text": "query useDatasourceLookupQuery {\n  pipelineDatasourceConnection: pipeline_datasource_connection {\n    edges {\n      node {\n        id\n        name\n      }\n    }\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = 'cb2104460c7fe5a16593066784745898';

export default node;
