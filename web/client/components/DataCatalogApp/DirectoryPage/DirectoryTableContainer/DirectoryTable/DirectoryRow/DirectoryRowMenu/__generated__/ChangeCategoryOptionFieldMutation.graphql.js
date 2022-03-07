/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
export type ChangeCategoryOptionFieldMutationVariables = {|
  dbNewCategoryId: string,
  dbFieldId: string,
|};
export type ChangeCategoryOptionFieldMutationResponse = {|
  +update_field_category_mapping: ?{|
    +returning: $ReadOnlyArray<{|
      +field: {|
        +id: string,
        +field_category_mappings: $ReadOnlyArray<{|
          +category: {|
            +id: string
          |}
        |}>,
      |}
    |}>
  |}
|};
export type ChangeCategoryOptionFieldMutation = {|
  variables: ChangeCategoryOptionFieldMutationVariables,
  response: ChangeCategoryOptionFieldMutationResponse,
|};
*/


/*
mutation ChangeCategoryOptionFieldMutation(
  $dbNewCategoryId: String!
  $dbFieldId: String!
) {
  update_field_category_mapping(where: {field_id: {_eq: $dbFieldId}}, _set: {category_id: $dbNewCategoryId}) {
    returning {
      field {
        id
        field_category_mappings {
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
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "dbFieldId"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "dbNewCategoryId"
},
v2 = [
  {
    "fields": [
      {
        "kind": "Variable",
        "name": "category_id",
        "variableName": "dbNewCategoryId"
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
            "variableName": "dbFieldId"
          }
        ],
        "kind": "ObjectValue",
        "name": "field_id"
      }
    ],
    "kind": "ObjectValue",
    "name": "where"
  }
],
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
  "name": "category",
  "plural": false,
  "selections": [
    (v3/*: any*/)
  ],
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "ChangeCategoryOptionFieldMutation",
    "selections": [
      {
        "alias": null,
        "args": (v2/*: any*/),
        "concreteType": "field_category_mapping_mutation_response",
        "kind": "LinkedField",
        "name": "update_field_category_mapping",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "field_category_mapping",
            "kind": "LinkedField",
            "name": "returning",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "field",
                "kind": "LinkedField",
                "name": "field",
                "plural": false,
                "selections": [
                  (v3/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "field_category_mapping",
                    "kind": "LinkedField",
                    "name": "field_category_mappings",
                    "plural": true,
                    "selections": [
                      (v4/*: any*/)
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
    "argumentDefinitions": [
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "ChangeCategoryOptionFieldMutation",
    "selections": [
      {
        "alias": null,
        "args": (v2/*: any*/),
        "concreteType": "field_category_mapping_mutation_response",
        "kind": "LinkedField",
        "name": "update_field_category_mapping",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "field_category_mapping",
            "kind": "LinkedField",
            "name": "returning",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "field",
                "kind": "LinkedField",
                "name": "field",
                "plural": false,
                "selections": [
                  (v3/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "field_category_mapping",
                    "kind": "LinkedField",
                    "name": "field_category_mappings",
                    "plural": true,
                    "selections": [
                      (v4/*: any*/),
                      (v3/*: any*/)
                    ],
                    "storageKey": null
                  }
                ],
                "storageKey": null
              },
              (v3/*: any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "caf8c963fd8d11dea97b0da4b43684df",
    "id": null,
    "metadata": {},
    "name": "ChangeCategoryOptionFieldMutation",
    "operationKind": "mutation",
    "text": "mutation ChangeCategoryOptionFieldMutation(\n  $dbNewCategoryId: String!\n  $dbFieldId: String!\n) {\n  update_field_category_mapping(where: {field_id: {_eq: $dbFieldId}}, _set: {category_id: $dbNewCategoryId}) {\n    returning {\n      field {\n        id\n        field_category_mappings {\n          category {\n            id\n          }\n          id\n        }\n      }\n      id\n    }\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = 'c869ad42ab8dedac943b274b3c9cabd5';

export default node;
