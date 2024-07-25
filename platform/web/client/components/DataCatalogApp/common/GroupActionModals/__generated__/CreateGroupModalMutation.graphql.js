/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
type CategoryGroupRow_category$ref = any;
type ParentCategoryChange_category$ref = any;
export type CreateGroupModalMutationVariables = {|
  id: string,
  name: string,
  parentCategoryId: string,
|};
export type CreateGroupModalMutationResponse = {|
  +insert_category: ?{|
    +returning: $ReadOnlyArray<{|
      +id: string,
      +$fragmentRefs: CategoryGroupRow_category$ref & ParentCategoryChange_category$ref,
    |}>
  |}
|};
export type CreateGroupModalMutation = {|
  variables: CreateGroupModalMutationVariables,
  response: CreateGroupModalMutationResponse,
|};
*/


/*
mutation CreateGroupModalMutation(
  $id: String!
  $name: String!
  $parentCategoryId: String!
) {
  insert_category(objects: {id: $id, name: $name, parent_id: $parentCategoryId}) {
    returning {
      id
      ...CategoryGroupRow_category
      ...ParentCategoryChange_category
    }
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
    "name": "id"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "name"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "parentCategoryId"
  }
],
v1 = [
  {
    "fields": [
      {
        "kind": "Variable",
        "name": "id",
        "variableName": "id"
      },
      {
        "kind": "Variable",
        "name": "name",
        "variableName": "name"
      },
      {
        "kind": "Variable",
        "name": "parent_id",
        "variableName": "parentCategoryId"
      }
    ],
    "kind": "ObjectValue",
    "name": "objects"
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v3 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "count",
    "storageKey": null
  }
],
v4 = {
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
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "CreateGroupModalMutation",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "category_mutation_response",
        "kind": "LinkedField",
        "name": "insert_category",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "category",
            "kind": "LinkedField",
            "name": "returning",
            "plural": true,
            "selections": [
              (v2/*: any*/),
              {
                "args": null,
                "kind": "FragmentSpread",
                "name": "CategoryGroupRow_category"
              },
              {
                "args": null,
                "kind": "FragmentSpread",
                "name": "ParentCategoryChange_category"
              }
            ],
            "storageKey": null
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
    "name": "CreateGroupModalMutation",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "category_mutation_response",
        "kind": "LinkedField",
        "name": "insert_category",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "category",
            "kind": "LinkedField",
            "name": "returning",
            "plural": true,
            "selections": [
              (v2/*: any*/),
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
                    "selections": (v3/*: any*/),
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
                    "selections": (v3/*: any*/),
                    "storageKey": null
                  }
                ],
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
                  (v2/*: any*/),
                  (v4/*: any*/)
                ],
                "storageKey": null
              },
              (v4/*: any*/)
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "filters": null,
            "handle": "appendNode",
            "key": "",
            "kind": "LinkedHandle",
            "name": "returning",
            "handleArgs": [
              {
                "kind": "Literal",
                "name": "connections",
                "value": [
                  "client:root:category_connection"
                ]
              },
              {
                "kind": "Literal",
                "name": "edgeTypeName",
                "value": "categoryEdge"
              }
            ]
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "c29cae59a54c600af5507d954103d49d",
    "id": null,
    "metadata": {},
    "name": "CreateGroupModalMutation",
    "operationKind": "mutation",
    "text": "mutation CreateGroupModalMutation(\n  $id: String!\n  $name: String!\n  $parentCategoryId: String!\n) {\n  insert_category(objects: {id: $id, name: $name, parent_id: $parentCategoryId}) {\n    returning {\n      id\n      ...CategoryGroupRow_category\n      ...ParentCategoryChange_category\n    }\n  }\n}\n\nfragment CategoryGroupRow_category on category {\n  id\n  name\n  visibilityStatus: visibility_status\n  ...useCategoryContentCount_category\n}\n\nfragment ParentCategoryChange_category on category {\n  id\n  parent {\n    id\n    children {\n      id\n    }\n  }\n  children {\n    id\n  }\n  ...CategoryGroupRow_category\n}\n\nfragment useCategoryContentCount_category on category {\n  fieldCategoryMappingsAggregate: field_category_mappings_aggregate {\n    aggregate {\n      count\n    }\n  }\n  childrenCategoryAggregate: children_aggregate {\n    aggregate {\n      count\n    }\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = '3c1b57b96405cb817716d5276638fd5f';

export default node;
