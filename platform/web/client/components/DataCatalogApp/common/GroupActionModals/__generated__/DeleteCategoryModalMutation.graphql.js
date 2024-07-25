/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
type ParentCategoryChange_category$ref = any;
export type DeleteCategoryModalMutationVariables = {|
  dbCategoryId: string
|};
export type DeleteCategoryModalMutationResponse = {|
  +delete_category_by_pk: ?{|
    +id: string,
    +$fragmentRefs: ParentCategoryChange_category$ref,
  |}
|};
export type DeleteCategoryModalMutation = {|
  variables: DeleteCategoryModalMutationVariables,
  response: DeleteCategoryModalMutationResponse,
|};
*/


/*
mutation DeleteCategoryModalMutation(
  $dbCategoryId: String!
) {
  delete_category_by_pk(id: $dbCategoryId) {
    id
    ...ParentCategoryChange_category
  }
}

fragment CategoryGroupRow_category on category {
  id
  name
  visibilityStatus: visibility_status
  ...useCategoryContentCount_category
}

fragment ParentCategoryChange_category on category {
  id
  parent {
    id
    children {
      id
    }
  }
  children {
    id
  }
  ...CategoryGroupRow_category
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
    "name": "dbCategoryId"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "id",
    "variableName": "dbCategoryId"
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
  "alias": null,
  "args": null,
  "concreteType": "category",
  "kind": "LinkedField",
  "name": "children",
  "plural": true,
  "selections": [
    (v2/*: any*/)
  ],
  "storageKey": null
},
v4 = [
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
    "name": "DeleteCategoryModalMutation",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "category",
        "kind": "LinkedField",
        "name": "delete_category_by_pk",
        "plural": false,
        "selections": [
          (v2/*: any*/),
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "ParentCategoryChange_category"
          }
        ],
        "storageKey": null
      }
    ],
    "type": "mutation_root",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "DeleteCategoryModalMutation",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "category",
        "kind": "LinkedField",
        "name": "delete_category_by_pk",
        "plural": false,
        "selections": [
          (v2/*: any*/),
          {
            "alias": null,
            "args": null,
            "filters": null,
            "handle": "deleteEdge",
            "key": "",
            "kind": "ScalarHandle",
            "name": "id",
            "handleArgs": [
              {
                "kind": "Literal",
                "name": "connections",
                "value": [
                  "client:root:category_connection"
                ]
              }
            ]
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "category",
            "kind": "LinkedField",
            "name": "parent",
            "plural": false,
            "selections": [
              (v2/*: any*/),
              (v3/*: any*/)
            ],
            "storageKey": null
          },
          (v3/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "name",
            "storageKey": null
          },
          {
            "alias": "visibilityStatus",
            "args": null,
            "kind": "ScalarField",
            "name": "visibility_status",
            "storageKey": null
          },
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
                "selections": (v4/*: any*/),
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
                "selections": (v4/*: any*/),
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
    "cacheID": "df58d8c6e80e4640820b2068965be8fe",
    "id": null,
    "metadata": {},
    "name": "DeleteCategoryModalMutation",
    "operationKind": "mutation",
    "text": "mutation DeleteCategoryModalMutation(\n  $dbCategoryId: String!\n) {\n  delete_category_by_pk(id: $dbCategoryId) {\n    id\n    ...ParentCategoryChange_category\n  }\n}\n\nfragment CategoryGroupRow_category on category {\n  id\n  name\n  visibilityStatus: visibility_status\n  ...useCategoryContentCount_category\n}\n\nfragment ParentCategoryChange_category on category {\n  id\n  parent {\n    id\n    children {\n      id\n    }\n  }\n  children {\n    id\n  }\n  ...CategoryGroupRow_category\n}\n\nfragment useCategoryContentCount_category on category {\n  fieldCategoryMappingsAggregate: field_category_mappings_aggregate {\n    aggregate {\n      count\n    }\n  }\n  childrenCategoryAggregate: children_aggregate {\n    aggregate {\n      count\n    }\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = '290bd41849d971e274e4a6cedc023a9c';

export default node;
