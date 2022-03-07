/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
export type CategoryGroupRowValueMutationVariables = {|
  dbId: string,
  newName: string,
  newVisibilityStatus: any,
|};
export type CategoryGroupRowValueMutationResponse = {|
  +update_category_by_pk: ?{|
    +id: string,
    +name: string,
    +visibilityStatus: any,
  |}
|};
export type CategoryGroupRowValueMutation = {|
  variables: CategoryGroupRowValueMutationVariables,
  response: CategoryGroupRowValueMutationResponse,
|};
*/


/*
mutation CategoryGroupRowValueMutation(
  $dbId: String!
  $newName: String!
  $newVisibilityStatus: visibility_status_enum!
) {
  update_category_by_pk(pk_columns: {id: $dbId}, _set: {name: $newName, visibility_status: $newVisibilityStatus}) {
    id
    name
    visibilityStatus: visibility_status
  }
}
*/

const node/*: ConcreteRequest*/ = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "dbId"
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
v1 = [
  {
    "alias": null,
    "args": [
      {
        "fields": [
          {
            "kind": "Variable",
            "name": "name",
            "variableName": "newName"
          },
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
            "kind": "Variable",
            "name": "id",
            "variableName": "dbId"
          }
        ],
        "kind": "ObjectValue",
        "name": "pk_columns"
      }
    ],
    "concreteType": "category",
    "kind": "LinkedField",
    "name": "update_category_by_pk",
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
        "alias": "visibilityStatus",
        "args": null,
        "kind": "ScalarField",
        "name": "visibility_status",
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "CategoryGroupRowValueMutation",
    "selections": (v1/*: any*/),
    "type": "mutation_root",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "CategoryGroupRowValueMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "b141cc2cf6557955ad6de2a5fe23d3df",
    "id": null,
    "metadata": {},
    "name": "CategoryGroupRowValueMutation",
    "operationKind": "mutation",
    "text": "mutation CategoryGroupRowValueMutation(\n  $dbId: String!\n  $newName: String!\n  $newVisibilityStatus: visibility_status_enum!\n) {\n  update_category_by_pk(pk_columns: {id: $dbId}, _set: {name: $newName, visibility_status: $newVisibilityStatus}) {\n    id\n    name\n    visibilityStatus: visibility_status\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = '7558d566626fb33cd406e5c9dee5590a';

export default node;
