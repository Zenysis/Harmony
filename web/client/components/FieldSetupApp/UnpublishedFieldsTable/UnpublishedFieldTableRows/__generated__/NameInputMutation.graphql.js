/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
export type NameInputMutationVariables = {|
  fieldId: string,
  name?: ?string,
|};
export type NameInputMutationResponse = {|
  +update_unpublished_field_by_pk: ?{|
    +id: string,
    +name: ?string,
  |}
|};
export type NameInputMutation = {|
  variables: NameInputMutationVariables,
  response: NameInputMutationResponse,
|};
*/


/*
mutation NameInputMutation(
  $fieldId: String!
  $name: String
) {
  update_unpublished_field_by_pk(pk_columns: {id: $fieldId}, _set: {name: $name}) {
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
    "name": "fieldId"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "name"
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
            "variableName": "name"
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
            "variableName": "fieldId"
          }
        ],
        "kind": "ObjectValue",
        "name": "pk_columns"
      }
    ],
    "concreteType": "unpublished_field",
    "kind": "LinkedField",
    "name": "update_unpublished_field_by_pk",
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
    "name": "NameInputMutation",
    "selections": (v1/*: any*/),
    "type": "mutation_root",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "NameInputMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "3ac9f16b5fde0316e6a952c515c23ac0",
    "id": null,
    "metadata": {},
    "name": "NameInputMutation",
    "operationKind": "mutation",
    "text": "mutation NameInputMutation(\n  $fieldId: String!\n  $name: String\n) {\n  update_unpublished_field_by_pk(pk_columns: {id: $fieldId}, _set: {name: $name}) {\n    id\n    name\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = '73d1edb904d713d885385a576e4df33d';

export default node;
