/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
export type usePipelineTimesHistoricalPipelinesQueryVariables = {|
  allSourcesName: string,
  timeWindow: any,
  unsuccessfulFilter: any,
|};
export type usePipelineTimesHistoricalPipelinesQueryResponse = {|
  +pipelineRunMetadataConnection: {|
    +edges: $ReadOnlyArray<{|
      +node: {|
        +generationDatetime: ?any,
        +startTS: ?any,
      |}
    |}>
  |}
|};
export type usePipelineTimesHistoricalPipelinesQuery = {|
  variables: usePipelineTimesHistoricalPipelinesQueryVariables,
  response: usePipelineTimesHistoricalPipelinesQueryResponse,
|};
*/


/*
query usePipelineTimesHistoricalPipelinesQuery(
  $allSourcesName: String!
  $timeWindow: timestamp!
  $unsuccessfulFilter: jsonb!
) {
  pipelineRunMetadataConnection: pipeline_run_metadata_connection(where: {source: {_eq: $allSourcesName}, generation_datetime: {_gte: $timeWindow}, _not: {digest_metadata: {_contains: $unsuccessfulFilter}}, digest_metadata: {_has_key: "start_ts"}}, order_by: {generation_datetime: desc}) {
    edges {
      node {
        generationDatetime: generation_datetime
        startTS: digest_metadata(path: "start_ts")
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
    "name": "timeWindow"
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
        "kind": "Literal",
        "name": "digest_metadata",
        "value": {
          "_has_key": "start_ts"
        }
      },
      {
        "fields": [
          {
            "kind": "Variable",
            "name": "_gte",
            "variableName": "timeWindow"
          }
        ],
        "kind": "ObjectValue",
        "name": "generation_datetime"
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
},
v3 = {
  "alias": "startTS",
  "args": [
    {
      "kind": "Literal",
      "name": "path",
      "value": "start_ts"
    }
  ],
  "kind": "ScalarField",
  "name": "digest_metadata",
  "storageKey": "digest_metadata(path:\"start_ts\")"
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "usePipelineTimesHistoricalPipelinesQuery",
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
                  (v3/*: any*/)
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
    "name": "usePipelineTimesHistoricalPipelinesQuery",
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
                  (v3/*: any*/),
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
    "cacheID": "d43ce6ee95f4c2563cd8f86aaf801b49",
    "id": null,
    "metadata": {},
    "name": "usePipelineTimesHistoricalPipelinesQuery",
    "operationKind": "query",
    "text": "query usePipelineTimesHistoricalPipelinesQuery(\n  $allSourcesName: String!\n  $timeWindow: timestamp!\n  $unsuccessfulFilter: jsonb!\n) {\n  pipelineRunMetadataConnection: pipeline_run_metadata_connection(where: {source: {_eq: $allSourcesName}, generation_datetime: {_gte: $timeWindow}, _not: {digest_metadata: {_contains: $unsuccessfulFilter}}, digest_metadata: {_has_key: \"start_ts\"}}, order_by: {generation_datetime: desc}) {\n    edges {\n      node {\n        generationDatetime: generation_datetime\n        startTS: digest_metadata(path: \"start_ts\")\n        id\n      }\n    }\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = '71bc6fa9deb75b5ef957fecb670cd09d';

export default node;
