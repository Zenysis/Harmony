/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
export type FieldCalculationSectionMutationVariables = {|
  dbId: string,
  newCalculation: any,
|};
export type FieldCalculationSectionMutationResponse = {|
  +update_field_by_pk: ?{|
    +id: string,
    +calculation: any,
  |}
|};
export type FieldCalculationSectionMutation = {|
  variables: FieldCalculationSectionMutationVariables,
  response: FieldCalculationSectionMutationResponse,
|};
*/


/*
mutation FieldCalculationSectionMutation(
  $dbId: String!
  $newCalculation: jsonb!
) {
  update_field_by_pk(pk_columns: {id: $dbId}, _set: {calculation: $newCalculation}) {
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
    "name": "dbId"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "newCalculation"
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
            "variableName": "newCalculation"
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
    "name": "FieldCalculationSectionMutation",
    "selections": (v1/*: any*/),
    "type": "mutation_root",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "FieldCalculationSectionMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "c39c8135f9fb5c9a77cac89206455a50",
    "id": null,
    "metadata": {},
    "name": "FieldCalculationSectionMutation",
    "operationKind": "mutation",
    "text": "mutation FieldCalculationSectionMutation(\n  $dbId: String!\n  $newCalculation: jsonb!\n) {\n  update_field_by_pk(pk_columns: {id: $dbId}, _set: {calculation: $newCalculation}) {\n    id\n    calculation\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = 'c2607746f643ff37b52e8c2b0301d9f7';

export default node;
