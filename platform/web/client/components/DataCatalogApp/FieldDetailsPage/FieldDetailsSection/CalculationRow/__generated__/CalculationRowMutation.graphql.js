/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
export type CalculationRowMutationVariables = {|
  dbId: string,
  newCalculation: any,
|};
export type CalculationRowMutationResponse = {|
  +update_field_by_pk: ?{|
    +id: string,
    +calculation: any,
  |}
|};
export type CalculationRowMutation = {|
  variables: CalculationRowMutationVariables,
  response: CalculationRowMutationResponse,
|};
*/


/*
mutation CalculationRowMutation(
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
    "name": "CalculationRowMutation",
    "selections": (v1/*: any*/),
    "type": "mutation_root",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "CalculationRowMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "b62a6624d2887bc74a72696de8068585",
    "id": null,
    "metadata": {},
    "name": "CalculationRowMutation",
    "operationKind": "mutation",
    "text": "mutation CalculationRowMutation(\n  $dbId: String!\n  $newCalculation: jsonb!\n) {\n  update_field_by_pk(pk_columns: {id: $dbId}, _set: {calculation: $newCalculation}) {\n    id\n    calculation\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = '9f01f8914e37250ad761db755856155d';

export default node;
