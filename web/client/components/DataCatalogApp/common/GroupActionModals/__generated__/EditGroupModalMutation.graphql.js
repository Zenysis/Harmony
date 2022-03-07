/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
export type EditGroupModalMutationVariables = {|
  dbCategoryId: string,
  newCategoryName: string,
|};
export type EditGroupModalMutationResponse = {|
  +update_category_by_pk: ?{|
    +id: string,
    +name: string,
  |}
|};
export type EditGroupModalMutation = {|
  variables: EditGroupModalMutationVariables,
  response: EditGroupModalMutationResponse,
|};
*/


/*
mutation EditGroupModalMutation(
  $dbCategoryId: String!
  $newCategoryName: String!
) {
  update_category_by_pk(pk_columns: {id: $dbCategoryId}, _set: {name: $newCategoryName}) {
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
    "name": "dbCategoryId"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "newCategoryName"
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
            "variableName": "newCategoryName"
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
            "variableName": "dbCategoryId"
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
    "name": "EditGroupModalMutation",
    "selections": (v1/*: any*/),
    "type": "mutation_root",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "EditGroupModalMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "ee3842dcae6d24cf30b8090eff8f4ea1",
    "id": null,
    "metadata": {},
    "name": "EditGroupModalMutation",
    "operationKind": "mutation",
    "text": "mutation EditGroupModalMutation(\n  $dbCategoryId: String!\n  $newCategoryName: String!\n) {\n  update_category_by_pk(pk_columns: {id: $dbCategoryId}, _set: {name: $newCategoryName}) {\n    id\n    name\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = 'ab4372f3a7bd5557ecad532d136dc613';

export default node;
