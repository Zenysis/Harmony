/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
export type usePipelineTimesLastSuccessfulPipelineQueryVariables = {|
  allSourcesName: string,
  unsuccessfulFilter: any,
|};
export type usePipelineTimesLastSuccessfulPipelineQueryResponse = {|
  +pipelineRunMetadataConnection: {|
    +edges: $ReadOnlyArray<{|
      +node: {|
        +generationDatetime: ?any
      |}
    |}>
  |}
|};
export type usePipelineTimesLastSuccessfulPipelineQuery = {|
  variables: usePipelineTimesLastSuccessfulPipelineQueryVariables,
  response: usePipelineTimesLastSuccessfulPipelineQueryResponse,
|};
*/


/*
query usePipelineTimesLastSuccessfulPipelineQuery(
  $allSourcesName: String!
  $unsuccessfulFilter: jsonb!
) {
  pipelineRunMetadataConnection: pipeline_run_metadata_connection(where: {source: {_eq: $allSourcesName}, _not: {digest_metadata: {_contains: $unsuccessfulFilter}}}, order_by: {generation_datetime: desc}, first: 1) {
    edges {
      node {
        generationDatetime: generation_datetime
        id
      }
    }
  }
}
*/

const node/*: ConcreteRequest*/ = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "allSourcesName"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "unsuccessfulFilter"
  }
],
v1 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 1
  },
  {
    "kind": "Literal",
    "name": "order_by",
    "value": {
      "generation_datetime": "desc"
    }
  },
  {
    "fields": [
      {
        "fields": [
          {
            "fields": [
              {
                "kind": "Variable",
                "name": "_contains",
                "variableName": "unsuccessfulFilter"
              }
            ],
            "kind": "ObjectValue",
            "name": "digest_metadata"
          }
        ],
        "kind": "ObjectValue",
        "name": "_not"
      },
      {
        "fields": [
          {
            "kind": "Variable",
            "name": "_eq",
            "variableName": "allSourcesName"
          }
        ],
        "kind": "ObjectValue",
        "name": "source"
      }
    ],
    "kind": "ObjectValue",
    "name": "where"
  }
],
v2 = {
  "alias": "generationDatetime",
  "args": null,
  "kind": "ScalarField",
  "name": "generation_datetime",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "usePipelineTimesLastSuccessfulPipelineQuery",
    "selections": [
      {
        "alias": "pipelineRunMetadataConnection",
        "args": (v1/*: any*/),
        "concreteType": "pipeline_run_metadataConnection",
        "kind": "LinkedField",
        "name": "pipeline_run_metadata_connection",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "pipeline_run_metadataEdge",
            "kind": "LinkedField",
            "name": "edges",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "pipeline_run_metadata",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  (v2/*: any*/)
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
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "usePipelineTimesLastSuccessfulPipelineQuery",
    "selections": [
      {
        "alias": "pipelineRunMetadataConnection",
        "args": (v1/*: any*/),
        "concreteType": "pipeline_run_metadataConnection",
        "kind": "LinkedField",
        "name": "pipeline_run_metadata_connection",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "pipeline_run_metadataEdge",
            "kind": "LinkedField",
            "name": "edges",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "pipeline_run_metadata",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  (v2/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "id",
                    "storageKey": null
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
    ]
  },
  "params": {
    "cacheID": "5e4d726e273a72fcd004c80507117bba",
    "id": null,
    "metadata": {},
    "name": "usePipelineTimesLastSuccessfulPipelineQuery",
    "operationKind": "query",
    "text": "query usePipelineTimesLastSuccessfulPipelineQuery(\n  $allSourcesName: String!\n  $unsuccessfulFilter: jsonb!\n) {\n  pipelineRunMetadataConnection: pipeline_run_metadata_connection(where: {source: {_eq: $allSourcesName}, _not: {digest_metadata: {_contains: $unsuccessfulFilter}}}, order_by: {generation_datetime: desc}, first: 1) {\n    edges {\n      node {\n        generationDatetime: generation_datetime\n        id\n      }\n    }\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = '6c292c1e71043ce297dc6e4d051abdb3';

export default node;
