/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
export type DescriptionInputMutationVariables = {|
  description?: ?string,
  fieldId: string,
|};
export type DescriptionInputMutationResponse = {|
  +update_unpublished_field_by_pk: ?{|
    +id: string,
    +description: ?string,
  |}
|};
export type DescriptionInputMutation = {|
  variables: DescriptionInputMutationVariables,
  response: DescriptionInputMutationResponse,
|};
*/


/*
mutation DescriptionInputMutation(
  $description: String
  $fieldId: String!
) {
  update_unpublished_field_by_pk(pk_columns: {id: $fieldId}, _set: {description: $description}) {
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
    "name": "description"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "fieldId"
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
            "variableName": "description"
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
    "name": "DescriptionInputMutation",
    "selections": (v1/*: any*/),
    "type": "mutation_root",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "DescriptionInputMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "77173475da6eb31abf1eac78c1075759",
    "id": null,
    "metadata": {},
    "name": "DescriptionInputMutation",
    "operationKind": "mutation",
    "text": "mutation DescriptionInputMutation(\n  $description: String\n  $fieldId: String!\n) {\n  update_unpublished_field_by_pk(pk_columns: {id: $fieldId}, _set: {description: $description}) {\n    id\n    description\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = '71e75bab10265d350e63b048bb5e076b';

export default node;
