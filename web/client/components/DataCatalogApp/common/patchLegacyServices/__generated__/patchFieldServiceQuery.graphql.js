/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
export type patchFieldServiceQueryVariables = {||};
export type patchFieldServiceQueryResponse = {|
  +fieldConnection: {|
    +edges: $ReadOnlyArray<{|
      +node: {|
        +id: string,
        +name: string,
        +serializedCalculation: any,
        +shortName: string,
      |}
    |}>
  |}
|};
export type patchFieldServiceQuery = {|
  variables: patchFieldServiceQueryVariables,
  response: patchFieldServiceQueryResponse,
|};
*/


/*
query patchFieldServiceQuery {
  fieldConnection: field_connection {
    edges {
      node {
        id
        name
        serializedCalculation: calculation
        shortName: short_name
      }
    }
  }
}
*/

const node/*: ConcreteRequest*/ = (function(){
var v0 = [
  {
    "alias": "fieldConnection",
    "args": null,
    "concreteType": "fieldConnection",
    "kind": "LinkedField",
    "name": "field_connection",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "fieldEdge",
        "kind": "LinkedField",
        "name": "edges",
        "plural": true,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "field",
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
              },
              {
                "alias": "serializedCalculation",
                "args": null,
                "kind": "ScalarField",
                "name": "calculation",
                "storageKey": null
              },
              {
                "alias": "shortName",
                "args": null,
                "kind": "ScalarField",
                "name": "short_name",
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
    "name": "patchFieldServiceQuery",
    "selections": (v0/*: any*/),
    "type": "query_root",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "patchFieldServiceQuery",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "4a93deaec11cd9d48030fd99d1a344c6",
    "id": null,
    "metadata": {},
    "name": "patchFieldServiceQuery",
    "operationKind": "query",
    "text": "query patchFieldServiceQuery {\n  fieldConnection: field_connection {\n    edges {\n      node {\n        id\n        name\n        serializedCalculation: calculation\n        shortName: short_name\n      }\n    }\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = 'b0a09e73b361dc4d3b605990bddadc43';

export default node;
