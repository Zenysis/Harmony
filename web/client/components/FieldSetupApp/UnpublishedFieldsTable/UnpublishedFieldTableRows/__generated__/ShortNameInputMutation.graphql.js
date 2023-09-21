/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
export type ShortNameInputMutationVariables = {|
  fieldId: string,
  shortName?: ?string,
|};
export type ShortNameInputMutationResponse = {|
  +update_unpublished_field_by_pk: ?{|
    +id: string,
    +short_name: ?string,
  |}
|};
export type ShortNameInputMutation = {|
  variables: ShortNameInputMutationVariables,
  response: ShortNameInputMutationResponse,
|};
*/


/*
mutation ShortNameInputMutation(
  $fieldId: String!
  $shortName: String
) {
  update_unpublished_field_by_pk(pk_columns: {id: $fieldId}, _set: {short_name: $shortName}) {
    id
    short_name
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
    "name": "shortName"
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
            "variableName": "shortName"
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
    "name": "ShortNameInputMutation",
    "selections": (v1/*: any*/),
    "type": "mutation_root",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "ShortNameInputMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "6bb0c242bba83a22aceb1d87eed52df8",
    "id": null,
    "metadata": {},
    "name": "ShortNameInputMutation",
    "operationKind": "mutation",
    "text": "mutation ShortNameInputMutation(\n  $fieldId: String!\n  $shortName: String\n) {\n  update_unpublished_field_by_pk(pk_columns: {id: $fieldId}, _set: {short_name: $shortName}) {\n    id\n    short_name\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = '6ce46c6581d06b7cdc7e4baa4adb0b61';

export default node;
