/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
export type usePipelineTimesLastPipelineQueryVariables = {|
  allSourcesName: string
|};
export type usePipelineTimesLastPipelineQueryResponse = {|
  +pipelineRunMetadataConnection: {|
    +edges: $ReadOnlyArray<{|
      +node: {|
        +nextRun: ?any
      |}
    |}>
  |}
|};
export type usePipelineTimesLastPipelineQuery = {|
  variables: usePipelineTimesLastPipelineQueryVariables,
  response: usePipelineTimesLastPipelineQueryResponse,
|};
*/


/*
query usePipelineTimesLastPipelineQuery(
  $allSourcesName: String!
) {
  pipelineRunMetadataConnection: pipeline_run_metadata_connection(where: {source: {_eq: $allSourcesName}, digest_metadata: {_has_key: "next_run"}}, order_by: {generation_datetime: desc}, first: 1) {
    edges {
      node {
        nextRun: digest_metadata(path: "next_run")
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
        "kind": "Literal",
        "name": "digest_metadata",
        "value": {
          "_has_key": "next_run"
        }
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
  "alias": "nextRun",
  "args": [
    {
      "kind": "Literal",
      "name": "path",
      "value": "next_run"
    }
  ],
  "kind": "ScalarField",
  "name": "digest_metadata",
  "storageKey": "digest_metadata(path:\"next_run\")"
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "usePipelineTimesLastPipelineQuery",
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
    "name": "usePipelineTimesLastPipelineQuery",
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
    "cacheID": "9da97422235887080dee24e93d47b323",
    "id": null,
    "metadata": {},
    "name": "usePipelineTimesLastPipelineQuery",
    "operationKind": "query",
    "text": "query usePipelineTimesLastPipelineQuery(\n  $allSourcesName: String!\n) {\n  pipelineRunMetadataConnection: pipeline_run_metadata_connection(where: {source: {_eq: $allSourcesName}, digest_metadata: {_has_key: \"next_run\"}}, order_by: {generation_datetime: desc}, first: 1) {\n    edges {\n      node {\n        nextRun: digest_metadata(path: \"next_run\")\n        id\n      }\n    }\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = 'df21fc003b2f8de0f59527bd3d66efa5';

export default node;
