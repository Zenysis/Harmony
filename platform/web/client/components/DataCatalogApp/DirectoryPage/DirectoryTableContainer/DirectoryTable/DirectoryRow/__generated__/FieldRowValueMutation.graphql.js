/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
export type FieldRowValueMutationVariables = {|
  categoryId: string,
  dbId: string,
  newDescription: string,
  newName: string,
  newVisibilityStatus: any,
|};
export type FieldRowValueMutationResponse = {|
  +update_field_by_pk: ?{|
    +id: string,
    +description: ?string,
    +name: string,
  |},
  +update_field_category_mapping: ?{|
    +returning: $ReadOnlyArray<{|
      +visibility_status: any,
      +field_id: string,
      +category_id: string,
    |}>
  |},
|};
export type FieldRowValueMutation = {|
  variables: FieldRowValueMutationVariables,
  response: FieldRowValueMutationResponse,
|};
*/


/*
mutation FieldRowValueMutation(
  $categoryId: String!
  $dbId: String!
  $newDescription: String!
  $newName: String!
  $newVisibilityStatus: visibility_status_enum!
) {
  update_field_by_pk(pk_columns: {id: $dbId}, _set: {description: $newDescription, name: $newName}) {
    id
    description
    name
  }
  update_field_category_mapping(where: {field_id: {_eq: $dbId}, category_id: {_eq: $categoryId}}, _set: {visibility_status: $newVisibilityStatus}) {
    returning {
      visibility_status
      field_id
      category_id
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
    "name": "categoryId"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "dbId"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "newDescription"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "newName"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "newVisibilityStatus"
  }
],
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": [
    {
      "fields": [
        {
          "kind": "Variable",
          "name": "description",
          "variableName": "newDescription"
        },
        {
          "kind": "Variable",
          "name": "name",
          "variableName": "newName"
        }
      ],
      "kind": "ObjectValue",
      "name": "_set"
    },
    {
      "fields": [
        {
          "kind": "Variable",
          "name": "id",
          "variableName": "dbId"
        }
      ],
      "kind": "ObjectValue",
      "name": "pk_columns"
    }
  ],
  "concreteType": "field",
  "kind": "LinkedField",
  "name": "update_field_by_pk",
  "plural": false,
  "selections": [
    (v1/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "description",
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
},
v3 = [
  {
    "fields": [
      {
        "kind": "Variable",
        "name": "visibility_status",
        "variableName": "newVisibilityStatus"
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
            "variableName": "categoryId"
          }
        ],
        "kind": "ObjectValue",
        "name": "category_id"
      },
      {
        "fields": [
          {
            "kind": "Variable",
            "name": "_eq",
            "variableName": "dbId"
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
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "visibility_status",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "field_id",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "category_id",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "FieldRowValueMutation",
    "selections": [
      (v2/*: any*/),
      {
        "alias": null,
        "args": (v3/*: any*/),
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
              (v4/*: any*/),
              (v5/*: any*/),
              (v6/*: any*/)
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
    "name": "FieldRowValueMutation",
    "selections": [
      (v2/*: any*/),
      {
        "alias": null,
        "args": (v3/*: any*/),
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
              (v4/*: any*/),
              (v5/*: any*/),
              (v6/*: any*/),
              (v1/*: any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "da1172f87766abfea8ce76b926bddd61",
    "id": null,
    "metadata": {},
    "name": "FieldRowValueMutation",
    "operationKind": "mutation",
    "text": "mutation FieldRowValueMutation(\n  $categoryId: String!\n  $dbId: String!\n  $newDescription: String!\n  $newName: String!\n  $newVisibilityStatus: visibility_status_enum!\n) {\n  update_field_by_pk(pk_columns: {id: $dbId}, _set: {description: $newDescription, name: $newName}) {\n    id\n    description\n    name\n  }\n  update_field_category_mapping(where: {field_id: {_eq: $dbId}, category_id: {_eq: $categoryId}}, _set: {visibility_status: $newVisibilityStatus}) {\n    returning {\n      visibility_status\n      field_id\n      category_id\n      id\n    }\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = '2de3db4b9639b8508231f4affc6a1ca0';

export default node;
