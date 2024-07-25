/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
export type DataStatusPageQueryVariables = {||};
export type DataStatusPageQueryResponse = {|
  +dataprep_flow_connection: {|
    +edges: $ReadOnlyArray<{|
      +node: {|
        +dataprepJobs: $ReadOnlyArray<{|
          +jobId: ?number,
          +lastModifiedOnDataprep: ?any,
          +status: ?string,
        |}>
      |}
    |}>
  |}
|};
export type DataStatusPageQuery = {|
  variables: DataStatusPageQueryVariables,
  response: DataStatusPageQueryResponse,
|};
*/


/*
query DataStatusPageQuery {
  dataprep_flow_connection {
    edges {
      node {
        dataprepJobs: dataprep_jobs(limit: 1, order_by: {created: desc}) {
          jobId: job_id
          lastModifiedOnDataprep: last_modified_on_dataprep
          status
          id
        }
        id
      }
    }
  }
}
*/

const node/*: ConcreteRequest*/ = (function(){
var v0 = [
  {
    "kind": "Literal",
    "name": "limit",
    "value": 1
  },
  {
    "kind": "Literal",
    "name": "order_by",
    "value": {
      "created": "desc"
    }
  }
],
v1 = {
  "alias": "jobId",
  "args": null,
  "kind": "ScalarField",
  "name": "job_id",
  "storageKey": null
},
v2 = {
  "alias": "lastModifiedOnDataprep",
  "args": null,
  "kind": "ScalarField",
  "name": "last_modified_on_dataprep",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "status",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "DataStatusPageQuery",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "dataprep_flowConnection",
        "kind": "LinkedField",
        "name": "dataprep_flow_connection",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "dataprep_flowEdge",
            "kind": "LinkedField",
            "name": "edges",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "dataprep_flow",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  {
                    "alias": "dataprepJobs",
                    "args": (v0/*: any*/),
                    "concreteType": "dataprep_job",
                    "kind": "LinkedField",
                    "name": "dataprep_jobs",
                    "plural": true,
                    "selections": [
                      (v1/*: any*/),
                      (v2/*: any*/),
                      (v3/*: any*/)
                    ],
                    "storageKey": "dataprep_jobs(limit:1,order_by:{\"created\":\"desc\"})"
                  }
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ],
    "type": "query_root",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "DataStatusPageQuery",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "dataprep_flowConnection",
        "kind": "LinkedField",
        "name": "dataprep_flow_connection",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "dataprep_flowEdge",
            "kind": "LinkedField",
            "name": "edges",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "dataprep_flow",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  {
                    "alias": "dataprepJobs",
                    "args": (v0/*: any*/),
                    "concreteType": "dataprep_job",
                    "kind": "LinkedField",
                    "name": "dataprep_jobs",
                    "plural": true,
                    "selections": [
                      (v1/*: any*/),
                      (v2/*: any*/),
                      (v3/*: any*/),
                      (v4/*: any*/)
                    ],
                    "storageKey": "dataprep_jobs(limit:1,order_by:{\"created\":\"desc\"})"
                  },
                  (v4/*: any*/)
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "2d1d1b0c624f1319bc7208af372a74fd",
    "id": null,
    "metadata": {},
    "name": "DataStatusPageQuery",
    "operationKind": "query",
    "text": "query DataStatusPageQuery {\n  dataprep_flow_connection {\n    edges {\n      node {\n        dataprepJobs: dataprep_jobs(limit: 1, order_by: {created: desc}) {\n          jobId: job_id\n          lastModifiedOnDataprep: last_modified_on_dataprep\n          status\n          id\n        }\n        id\n      }\n    }\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = '98d943accd23d32e53b6e1ec8fa0b6aa';

export default node;
