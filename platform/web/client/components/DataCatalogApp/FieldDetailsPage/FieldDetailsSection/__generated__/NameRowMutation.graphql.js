/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
export type NameRowMutationVariables = {|
  dbId: string,
  newName: string,
|};
export type NameRowMutationResponse = {|
  +update_field_by_pk: ?{|
    +id: string,
    +name: string,
  |}
|};
export type NameRowMutation = {|
  variables: NameRowMutationVariables,
  response: NameRowMutationResponse,
|};
*/


/*
mutation NameRowMutation(
  $dbId: String!
  $newName: String!
) {
  update_field_by_pk(pk_columns: {id: $dbId}, _set: {name: $newName}) {
    id
    name
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
    "name": "NameRowMutation",
    "selections": (v1/*: any*/),
    "type": "mutation_root",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "NameRowMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "9e6a22461b6be175be12d9f7cf93462a",
    "id": null,
    "metadata": {},
    "name": "NameRowMutation",
    "operationKind": "mutation",
    "text": "mutation NameRowMutation(\n  $dbId: String!\n  $newName: String!\n) {\n  update_field_by_pk(pk_columns: {id: $dbId}, _set: {name: $newName}) {\n    id\n    name\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = '14dd0f5a0ea9807262d38599dd145173';

export default node;
