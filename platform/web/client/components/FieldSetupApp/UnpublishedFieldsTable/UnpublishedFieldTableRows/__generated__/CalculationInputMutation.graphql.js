/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
export type CalculationInputMutationVariables = {|
  calculation: any,
  fieldId: string,
|};
export type CalculationInputMutationResponse = {|
  +update_unpublished_field_by_pk: ?{|
    +id: string,
    +calculation: ?any,
  |}
|};
export type CalculationInputMutation = {|
  variables: CalculationInputMutationVariables,
  response: CalculationInputMutationResponse,
|};
*/


/*
mutation CalculationInputMutation(
  $calculation: jsonb!
  $fieldId: String!
) {
  update_unpublished_field_by_pk(pk_columns: {id: $fieldId}, _set: {calculation: $calculation}) {
    id
    calculation
  }
}
*/

const node/*: ConcreteRequest*/ = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "calculation"
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
            "name": "calculation",
            "variableName": "calculation"
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
        "name": "calculation",
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
    "name": "CalculationInputMutation",
    "selections": (v1/*: any*/),
    "type": "mutation_root",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "CalculationInputMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "3068f6c655d218ff668f22849d60aa4e",
    "id": null,
    "metadata": {},
    "name": "CalculationInputMutation",
    "operationKind": "mutation",
    "text": "mutation CalculationInputMutation(\n  $calculation: jsonb!\n  $fieldId: String!\n) {\n  update_unpublished_field_by_pk(pk_columns: {id: $fieldId}, _set: {calculation: $calculation}) {\n    id\n    calculation\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = '923878f3bd9c3c52993a87905a723f23';

export default node;
