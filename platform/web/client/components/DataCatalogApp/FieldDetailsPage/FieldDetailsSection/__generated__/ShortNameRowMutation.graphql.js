/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
export type ShortNameRowMutationVariables = {|
  dbId: string,
  newShortName: string,
|};
export type ShortNameRowMutationResponse = {|
  +update_field_by_pk: ?{|
    +id: string,
    +shortName: string,
  |}
|};
export type ShortNameRowMutation = {|
  variables: ShortNameRowMutationVariables,
  response: ShortNameRowMutationResponse,
|};
*/


/*
mutation ShortNameRowMutation(
  $dbId: String!
  $newShortName: String!
) {
  update_field_by_pk(pk_columns: {id: $dbId}, _set: {short_name: $newShortName}) {
    id
    shortName: short_name
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
    "name": "newShortName"
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
            "name": "short_name",
            "variableName": "newShortName"
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
        "alias": "shortName",
        "args": null,
        "kind": "ScalarField",
        "name": "short_name",
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
    "name": "ShortNameRowMutation",
    "selections": (v1/*: any*/),
    "type": "mutation_root",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "ShortNameRowMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "f0db9ea5d7e0c58639391a8cb17f2cb0",
    "id": null,
    "metadata": {},
    "name": "ShortNameRowMutation",
    "operationKind": "mutation",
    "text": "mutation ShortNameRowMutation(\n  $dbId: String!\n  $newShortName: String!\n) {\n  update_field_by_pk(pk_columns: {id: $dbId}, _set: {short_name: $newShortName}) {\n    id\n    shortName: short_name\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = 'c132fa831345919125a3d2ee98db6417';

export default node;
