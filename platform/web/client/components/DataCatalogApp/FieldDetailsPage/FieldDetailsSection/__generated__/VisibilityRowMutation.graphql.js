/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
export type VisibilityRowMutationVariables = {|
  dbCategoryId: string,
  dbFieldId: string,
  newVisibilityStatus: any,
|};
export type VisibilityRowMutationResponse = {|
  +update_field_category_mapping: ?{|
    +returning: $ReadOnlyArray<{|
      +field_id: string,
      +category_id: string,
      +visibility_status: any,
    |}>
  |}
|};
export type VisibilityRowMutation = {|
  variables: VisibilityRowMutationVariables,
  response: VisibilityRowMutationResponse,
|};
*/


/*
mutation VisibilityRowMutation(
  $dbCategoryId: String!
  $dbFieldId: String!
  $newVisibilityStatus: visibility_status_enum!
) {
  update_field_category_mapping(where: {category_id: {_eq: $dbCategoryId}, field_id: {_eq: $dbFieldId}}, _set: {visibility_status: $newVisibilityStatus}) {
    returning {
      field_id
      category_id
      visibility_status
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
    "name": "dbFieldId"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "newVisibilityStatus"
  }
],
v1 = [
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
            "variableName": "dbCategoryId"
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
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "field_id",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "category_id",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "visibility_status",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "VisibilityRowMutation",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
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
              (v2/*: any*/),
              (v3/*: any*/),
              (v4/*: any*/)
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
    "name": "VisibilityRowMutation",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
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
              (v2/*: any*/),
              (v3/*: any*/),
              (v4/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "id",
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
    "cacheID": "486bb09a538d7c52254528e68ca45351",
    "id": null,
    "metadata": {},
    "name": "VisibilityRowMutation",
    "operationKind": "mutation",
    "text": "mutation VisibilityRowMutation(\n  $dbCategoryId: String!\n  $dbFieldId: String!\n  $newVisibilityStatus: visibility_status_enum!\n) {\n  update_field_category_mapping(where: {category_id: {_eq: $dbCategoryId}, field_id: {_eq: $dbFieldId}}, _set: {visibility_status: $newVisibilityStatus}) {\n    returning {\n      field_id\n      category_id\n      visibility_status\n      id\n    }\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = '1b7ade490251fa766702f78c93019428';

export default node;
