/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
export type useDeleteSourceMutationVariables = {|
  selfServeSourceId: number,
  sourceId: string,
  isDataprep: boolean,
  dataprepFlowId: number,
|};
export type useDeleteSourceMutationResponse = {|
  +delete_self_serve_source_by_pk: ?{|
    +id: string
  |},
  +delete_data_upload_file_summary: ?{|
    +returning: $ReadOnlyArray<{|
      +id: string
    |}>
  |},
  +delete_dataprep_job?: ?{|
    +returning: $ReadOnlyArray<{|
      +id: string
    |}>
  |},
  +delete_dataprep_flow_by_pk?: ?{|
    +id: string
  |},
|};
export type useDeleteSourceMutation = {|
  variables: useDeleteSourceMutationVariables,
  response: useDeleteSourceMutationResponse,
|};
*/


/*
mutation useDeleteSourceMutation(
  $selfServeSourceId: Int!
  $sourceId: String!
  $isDataprep: Boolean!
  $dataprepFlowId: Int!
) {
  delete_self_serve_source_by_pk(id: $selfServeSourceId) {
    id
  }
  delete_data_upload_file_summary(where: {source_id: {_eq: $sourceId}}) {
    returning {
      id
    }
  }
  delete_dataprep_job(where: {dataprep_flow_id: {_eq: $dataprepFlowId}}) @include(if: $isDataprep) {
    returning {
      id
    }
  }
  delete_dataprep_flow_by_pk(id: $dataprepFlowId) @include(if: $isDataprep) {
    id
  }
}
*/

const node/*: ConcreteRequest*/ = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "dataprepFlowId"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "isDataprep"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "selfServeSourceId"
},
v3 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "sourceId"
},
v4 = [
  {
    "kind": "Variable",
    "name": "id",
    "variableName": "selfServeSourceId"
  }
],
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v6 = [
  (v5/*: any*/)
],
v7 = {
  "alias": null,
  "args": [
    {
      "fields": [
        {
          "fields": [
            {
              "kind": "Variable",
              "name": "_eq",
              "variableName": "sourceId"
            }
          ],
          "kind": "ObjectValue",
          "name": "source_id"
        }
      ],
      "kind": "ObjectValue",
      "name": "where"
    }
  ],
  "concreteType": "data_upload_file_summary_mutation_response",
  "kind": "LinkedField",
  "name": "delete_data_upload_file_summary",
  "plural": false,
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "data_upload_file_summary",
      "kind": "LinkedField",
      "name": "returning",
      "plural": true,
      "selections": (v6/*: any*/),
      "storageKey": null
    }
  ],
  "storageKey": null
},
v8 = {
  "condition": "isDataprep",
  "kind": "Condition",
  "passingValue": true,
  "selections": [
    {
      "alias": null,
      "args": [
        {
          "fields": [
            {
              "fields": [
                {
                  "kind": "Variable",
                  "name": "_eq",
                  "variableName": "dataprepFlowId"
                }
              ],
              "kind": "ObjectValue",
              "name": "dataprep_flow_id"
            }
          ],
          "kind": "ObjectValue",
          "name": "where"
        }
      ],
      "concreteType": "dataprep_job_mutation_response",
      "kind": "LinkedField",
      "name": "delete_dataprep_job",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "dataprep_job",
          "kind": "LinkedField",
          "name": "returning",
          "plural": true,
          "selections": (v6/*: any*/),
          "storageKey": null
        }
      ],
      "storageKey": null
    },
    {
      "alias": null,
      "args": [
        {
          "kind": "Variable",
          "name": "id",
          "variableName": "dataprepFlowId"
        }
      ],
      "concreteType": "dataprep_flow",
      "kind": "LinkedField",
      "name": "delete_dataprep_flow_by_pk",
      "plural": false,
      "selections": (v6/*: any*/),
      "storageKey": null
    }
  ]
};
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/),
      (v2/*: any*/),
      (v3/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "useDeleteSourceMutation",
    "selections": [
      {
        "alias": null,
        "args": (v4/*: any*/),
        "concreteType": "self_serve_source",
        "kind": "LinkedField",
        "name": "delete_self_serve_source_by_pk",
        "plural": false,
        "selections": (v6/*: any*/),
        "storageKey": null
      },
      (v7/*: any*/),
      (v8/*: any*/)
    ],
    "type": "mutation_root",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v2/*: any*/),
      (v3/*: any*/),
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "useDeleteSourceMutation",
    "selections": [
      {
        "alias": null,
        "args": (v4/*: any*/),
        "concreteType": "self_serve_source",
        "kind": "LinkedField",
        "name": "delete_self_serve_source_by_pk",
        "plural": false,
        "selections": [
          (v5/*: any*/),
          {
            "alias": null,
            "args": null,
            "filters": null,
            "handle": "deleteEdge",
            "key": "",
            "kind": "ScalarHandle",
            "name": "id",
            "handleArgs": [
              {
                "kind": "Literal",
                "name": "connections",
                "value": [
                  "client:root:self_serve_source_connection"
                ]
              }
            ]
          }
        ],
        "storageKey": null
      },
      (v7/*: any*/),
      (v8/*: any*/)
    ]
  },
  "params": {
    "cacheID": "164ae20a2c316fea382fad5b69792242",
    "id": null,
    "metadata": {},
    "name": "useDeleteSourceMutation",
    "operationKind": "mutation",
    "text": "mutation useDeleteSourceMutation(\n  $selfServeSourceId: Int!\n  $sourceId: String!\n  $isDataprep: Boolean!\n  $dataprepFlowId: Int!\n) {\n  delete_self_serve_source_by_pk(id: $selfServeSourceId) {\n    id\n  }\n  delete_data_upload_file_summary(where: {source_id: {_eq: $sourceId}}) {\n    returning {\n      id\n    }\n  }\n  delete_dataprep_job(where: {dataprep_flow_id: {_eq: $dataprepFlowId}}) @include(if: $isDataprep) {\n    returning {\n      id\n    }\n  }\n  delete_dataprep_flow_by_pk(id: $dataprepFlowId) @include(if: $isDataprep) {\n    id\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = 'd3fd332234e30c279bc6e062eefd8681';

export default node;
