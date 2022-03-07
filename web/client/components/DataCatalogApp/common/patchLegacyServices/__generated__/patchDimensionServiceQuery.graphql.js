/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
export type patchDimensionServiceQueryVariables = {||};
export type patchDimensionServiceQueryResponse = {|
  +dimensionConnection: {|
    +edges: $ReadOnlyArray<{|
      +node: {|
        +id: string,
        +description: ?string,
        +name: string,
        +dimensionCategoryMappings: $ReadOnlyArray<{|
          +category: {|
            +id: string,
            +name: string,
          |}
        |}>,
      |}
    |}>
  |}
|};
export type patchDimensionServiceQuery = {|
  variables: patchDimensionServiceQueryVariables,
  response: patchDimensionServiceQueryResponse,
|};
*/


/*
query patchDimensionServiceQuery {
  dimensionConnection: dimension_connection {
    edges {
      node {
        id
        description
        name
        dimensionCategoryMappings: dimension_category_mappings {
          category: dimension_category {
            id
            name
          }
          id
        }
      }
    }
  }
}
*/

const node/*: ConcreteRequest*/ = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "description",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v3 = {
  "alias": "category",
  "args": null,
  "concreteType": "dimension_category",
  "kind": "LinkedField",
  "name": "dimension_category",
  "plural": false,
  "selections": [
    (v0/*: any*/),
    (v2/*: any*/)
  ],
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "patchDimensionServiceQuery",
    "selections": [
      {
        "alias": "dimensionConnection",
        "args": null,
        "concreteType": "dimensionConnection",
        "kind": "LinkedField",
        "name": "dimension_connection",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "dimensionEdge",
            "kind": "LinkedField",
            "name": "edges",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "dimension",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  (v0/*: any*/),
                  (v1/*: any*/),
                  (v2/*: any*/),
                  {
                    "alias": "dimensionCategoryMappings",
                    "args": null,
                    "concreteType": "dimension_category_mapping",
                    "kind": "LinkedField",
                    "name": "dimension_category_mappings",
                    "plural": true,
                    "selections": [
                      (v3/*: any*/)
                    ],
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
    ],
    "type": "query_root",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "patchDimensionServiceQuery",
    "selections": [
      {
        "alias": "dimensionConnection",
        "args": null,
        "concreteType": "dimensionConnection",
        "kind": "LinkedField",
        "name": "dimension_connection",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "dimensionEdge",
            "kind": "LinkedField",
            "name": "edges",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "dimension",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  (v0/*: any*/),
                  (v1/*: any*/),
                  (v2/*: any*/),
                  {
                    "alias": "dimensionCategoryMappings",
                    "args": null,
                    "concreteType": "dimension_category_mapping",
                    "kind": "LinkedField",
                    "name": "dimension_category_mappings",
                    "plural": true,
                    "selections": [
                      (v3/*: any*/),
                      (v0/*: any*/)
                    ],
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
    ]
  },
  "params": {
    "cacheID": "ef5b9ca82218a3ef0cadd6e46db73acd",
    "id": null,
    "metadata": {},
    "name": "patchDimensionServiceQuery",
    "operationKind": "query",
    "text": "query patchDimensionServiceQuery {\n  dimensionConnection: dimension_connection {\n    edges {\n      node {\n        id\n        description\n        name\n        dimensionCategoryMappings: dimension_category_mappings {\n          category: dimension_category {\n            id\n            name\n          }\n          id\n        }\n      }\n    }\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = '75be4cc1714d34e52ab32e2c0d1de3b7';

export default node;
