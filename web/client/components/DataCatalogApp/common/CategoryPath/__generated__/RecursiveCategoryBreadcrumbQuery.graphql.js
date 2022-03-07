/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
export type RecursiveCategoryBreadcrumbQueryVariables = {|
  id: string
|};
export type RecursiveCategoryBreadcrumbQueryResponse = {|
  +node: ?{|
    +name?: string,
    +parent?: ?{|
      +id: string
    |},
  |}
|};
export type RecursiveCategoryBreadcrumbQuery = {|
  variables: RecursiveCategoryBreadcrumbQueryVariables,
  response: RecursiveCategoryBreadcrumbQueryResponse,
|};
*/


/*
query RecursiveCategoryBreadcrumbQuery(
  $id: ID!
) {
  node(id: $id) {
    __typename
    ... on category {
      name
      parent {
        id
      }
    }
    id
  }
}
*/

const node/*: ConcreteRequest*/ = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "id"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "id",
    "variableName": "id"
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v3 = {
  "kind": "InlineFragment",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "name",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "category",
      "kind": "LinkedField",
      "name": "parent",
      "plural": false,
      "selections": [
        (v2/*: any*/)
      ],
      "storageKey": null
    }
  ],
  "type": "category",
  "abstractKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "RecursiveCategoryBreadcrumbQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "node",
        "plural": false,
        "selections": [
          (v3/*: any*/)
        ],
        "storageKey": null
      }
    ],
    "type": "query_root",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "RecursiveCategoryBreadcrumbQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "node",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "__typename",
            "storageKey": null
          },
          (v2/*: any*/),
          (v3/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "8b6f9ebcb932a88fab7e75319f32cb9e",
    "id": null,
    "metadata": {},
    "name": "RecursiveCategoryBreadcrumbQuery",
    "operationKind": "query",
    "text": "query RecursiveCategoryBreadcrumbQuery(\n  $id: ID!\n) {\n  node(id: $id) {\n    __typename\n    ... on category {\n      name\n      parent {\n        id\n      }\n    }\n    id\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = 'deda437a6bb5f477bdc2cb9ce9c79e05';

export default node;
