/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
type useCategoryContentCount_category$ref = any;
export type BreadcrumbLeafItemQueryVariables = {|
  id: string
|};
export type BreadcrumbLeafItemQueryResponse = {|
  +node: ?{|
    +name?: string,
    +parent?: ?{|
      +id: string
    |},
    +$fragmentRefs: useCategoryContentCount_category$ref,
  |}
|};
export type BreadcrumbLeafItemQuery = {|
  variables: BreadcrumbLeafItemQueryVariables,
  response: BreadcrumbLeafItemQueryResponse,
|};
*/


/*
query BreadcrumbLeafItemQuery(
  $id: ID!
) {
  node(id: $id) {
    __typename
    ... on category {
      name
      parent {
        id
      }
      ...useCategoryContentCount_category
    }
    id
  }
}

fragment useCategoryContentCount_category on category {
  fieldCategoryMappingsAggregate: field_category_mappings_aggregate {
    aggregate {
      count
    }
  }
  childrenCategoryAggregate: children_aggregate {
    aggregate {
      count
    }
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
  "name": "name",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "concreteType": "category",
  "kind": "LinkedField",
  "name": "parent",
  "plural": false,
  "selections": [
    (v3/*: any*/)
  ],
  "storageKey": null
},
v5 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "count",
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "BreadcrumbLeafItemQuery",
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
            "kind": "InlineFragment",
            "selections": [
              (v2/*: any*/),
              (v4/*: any*/),
              {
                "args": null,
                "kind": "FragmentSpread",
                "name": "useCategoryContentCount_category"
              }
            ],
            "type": "category",
            "abstractKey": null
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
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "BreadcrumbLeafItemQuery",
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
          (v3/*: any*/),
          {
            "kind": "InlineFragment",
            "selections": [
              (v2/*: any*/),
              (v4/*: any*/),
              {
                "alias": "fieldCategoryMappingsAggregate",
                "args": null,
                "concreteType": "field_category_mapping_aggregate",
                "kind": "LinkedField",
                "name": "field_category_mappings_aggregate",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "field_category_mapping_aggregate_fields",
                    "kind": "LinkedField",
                    "name": "aggregate",
                    "plural": false,
                    "selections": (v5/*: any*/),
                    "storageKey": null
                  }
                ],
                "storageKey": null
              },
              {
                "alias": "childrenCategoryAggregate",
                "args": null,
                "concreteType": "category_aggregate",
                "kind": "LinkedField",
                "name": "children_aggregate",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "category_aggregate_fields",
                    "kind": "LinkedField",
                    "name": "aggregate",
                    "plural": false,
                    "selections": (v5/*: any*/),
                    "storageKey": null
                  }
                ],
                "storageKey": null
              }
            ],
            "type": "category",
            "abstractKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "601f1d4b9b06b12943802ecc6b6bbef8",
    "id": null,
    "metadata": {},
    "name": "BreadcrumbLeafItemQuery",
    "operationKind": "query",
    "text": "query BreadcrumbLeafItemQuery(\n  $id: ID!\n) {\n  node(id: $id) {\n    __typename\n    ... on category {\n      name\n      parent {\n        id\n      }\n      ...useCategoryContentCount_category\n    }\n    id\n  }\n}\n\nfragment useCategoryContentCount_category on category {\n  fieldCategoryMappingsAggregate: field_category_mappings_aggregate {\n    aggregate {\n      count\n    }\n  }\n  childrenCategoryAggregate: children_aggregate {\n    aggregate {\n      count\n    }\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = 'ec53d02085090cda85d441a615dbea72';

export default node;
