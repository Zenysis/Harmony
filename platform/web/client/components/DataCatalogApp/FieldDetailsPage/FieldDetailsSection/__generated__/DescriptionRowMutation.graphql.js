/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
export type DescriptionRowMutationVariables = {|
  dbId: string,
  newDescription: string,
|};
export type DescriptionRowMutationResponse = {|
  +update_field_by_pk: ?{|
    +id: string,
    +description: ?string,
  |}
|};
export type DescriptionRowMutation = {|
  variables: DescriptionRowMutationVariables,
  response: DescriptionRowMutationResponse,
|};
*/


/*
mutation DescriptionRowMutation(
  $dbId: String!
  $newDescription: String!
) {
  update_field_by_pk(pk_columns: {id: $dbId}, _set: {description: $newDescription}) {
    id
    description
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
    "name": "newDescription"
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
            "name": "description",
            "variableName": "newDescription"
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
        "name": "description",
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
    "name": "DescriptionRowMutation",
    "selections": (v1/*: any*/),
    "type": "mutation_root",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "DescriptionRowMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "2ad16102abced01ef6a208c679cfc289",
    "id": null,
    "metadata": {},
    "name": "DescriptionRowMutation",
    "operationKind": "mutation",
    "text": "mutation DescriptionRowMutation(\n  $dbId: String!\n  $newDescription: String!\n) {\n  update_field_by_pk(pk_columns: {id: $dbId}, _set: {description: $newDescription}) {\n    id\n    description\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = 'cf76310d609320f8370766d92c84ca40';

export default node;
