/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
export type ChangeCategoryOptionCategoryMutationVariables = {|
  dbCategoryId: string,
  dbNewParentCategoryId: string,
|};
export type ChangeCategoryOptionCategoryMutationResponse = {|
  +update_category_to_category_mapping: ?{|
    +returning: $ReadOnlyArray<{|
      +category: {|
        +id: string,
        +category_to_category_mappings: $ReadOnlyArray<{|
          +category: {|
            +id: string
          |}
        |}>,
      |}
    |}>
  |}
|};
export type ChangeCategoryOptionCategoryMutation = {|
  variables: ChangeCategoryOptionCategoryMutationVariables,
  response: ChangeCategoryOptionCategoryMutationResponse,
|};
*/


/*
mutation ChangeCategoryOptionCategoryMutation(
  $dbCategoryId: String!
  $dbNewParentCategoryId: String!
) {
  update_category_to_category_mapping(where: {category_id: {_eq: $dbCategoryId}}, _set: {parent_category_id: $dbNewParentCategoryId}) {
    returning {
      category {
        id
        category_to_category_mappings {
          category {
            id
          }
          id
        }
      }
      id
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
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "dbNewParentCategoryId"
  }
],
v1 = [
  {
    "fields": [
      {
        "kind": "Variable",
        "name": "parent_category_id",
        "variableName": "dbNewParentCategoryId"
      }
    ],
    "kind": "ObjectValue",
    "name": "_set"
  },
  {
    "fields": [
      {
        "fields": [
          {
            "kind": "Variable",
            "name": "_eq",
            "variableName": "dbCategoryId"
          }
        ],
        "kind": "ObjectValue",
        "name": "category_id"
      }
    ],
    "kind": "ObjectValue",
    "name": "where"
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
  "name": "category",
  "plural": false,
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
    "name": "ChangeCategoryOptionCategoryMutation",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "category_to_category_mapping_mutation_response",
        "kind": "LinkedField",
        "name": "update_category_to_category_mapping",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "category_to_category_mapping",
            "kind": "LinkedField",
            "name": "returning",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "category",
                "kind": "LinkedField",
                "name": "category",
                "plural": false,
                "selections": [
                  (v2/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "category_to_category_mapping",
                    "kind": "LinkedField",
                    "name": "category_to_category_mappings",
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
    "type": "mutation_root",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "ChangeCategoryOptionCategoryMutation",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "category_to_category_mapping_mutation_response",
        "kind": "LinkedField",
        "name": "update_category_to_category_mapping",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "category_to_category_mapping",
            "kind": "LinkedField",
            "name": "returning",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "category",
                "kind": "LinkedField",
                "name": "category",
                "plural": false,
                "selections": [
                  (v2/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "category_to_category_mapping",
                    "kind": "LinkedField",
                    "name": "category_to_category_mappings",
                    "plural": true,
                    "selections": [
                      (v3/*: any*/),
                      (v2/*: any*/)
                    ],
                    "storageKey": null
                  }
                ],
                "storageKey": null
              },
              (v2/*: any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "cd99e7c782b6e5a5172be5e49ca50ccd",
    "id": null,
    "metadata": {},
    "name": "ChangeCategoryOptionCategoryMutation",
    "operationKind": "mutation",
    "text": "mutation ChangeCategoryOptionCategoryMutation(\n  $dbCategoryId: String!\n  $dbNewParentCategoryId: String!\n) {\n  update_category_to_category_mapping(where: {category_id: {_eq: $dbCategoryId}}, _set: {parent_category_id: $dbNewParentCategoryId}) {\n    returning {\n      category {\n        id\n        category_to_category_mappings {\n          category {\n            id\n          }\n          id\n        }\n      }\n      id\n    }\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = 'c0ec9d4d210d97aef18624899d64185a';

export default node;
