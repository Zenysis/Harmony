/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type ActionCell_selfServeSource$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type SourceTable_selfServeSource$ref: FragmentReference;
declare export opaque type SourceTable_selfServeSource$fragmentType: SourceTable_selfServeSource$ref;
export type SourceTable_selfServeSource = {|
  +edges: $ReadOnlyArray<{|
    +node: {|
      +sourceId: string,
      +pipelineDatasource: {|
        +name: string,
        +unpublishedFieldsCount: {|
          +aggregate: ?{|
            +count: number
          |}
        |},
      |},
      +lastModified: any,
      +latestFileSummary: $ReadOnlyArray<{|
        +lastModified: any
      |}>,
      +dataprepFlow: ?{|
        +dataprepJobs: $ReadOnlyArray<{|
          +lastModifiedOnDataprep: ?any,
          +status: ?string,
        |}>
      |},
      +$fragmentRefs: ActionCell_selfServeSource$ref,
    |}
  |}>,
  +$refType: SourceTable_selfServeSource$ref,
|};
export type SourceTable_selfServeSource$data = SourceTable_selfServeSource;
export type SourceTable_selfServeSource$key = {
  +$data?: SourceTable_selfServeSource$data,
  +$fragmentRefs: SourceTable_selfServeSource$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = (function(){
var v0 = {
  "alias": "lastModified",
  "args": null,
  "kind": "ScalarField",
  "name": "last_modified",
  "storageKey": null
},
v1 = {
  "kind": "Literal",
  "name": "limit",
  "value": 1
};
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "SourceTable_selfServeSource",
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "self_serve_sourceEdge",
      "kind": "LinkedField",
      "name": "edges",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "self_serve_source",
          "kind": "LinkedField",
          "name": "node",
          "plural": false,
          "selections": [
            {
              "alias": "sourceId",
              "args": null,
              "kind": "ScalarField",
              "name": "source_id",
              "storageKey": null
            },
            {
              "alias": "pipelineDatasource",
              "args": null,
              "concreteType": "pipeline_datasource",
              "kind": "LinkedField",
              "name": "pipeline_datasource",
              "plural": false,
              "selections": [
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "name",
                  "storageKey": null
                },
                {
                  "alias": "unpublishedFieldsCount",
                  "args": null,
                  "concreteType": "unpublished_field_pipeline_datasource_mapping_aggregate",
                  "kind": "LinkedField",
                  "name": "unpublished_field_pipeline_datasource_mappings_aggregate",
                  "plural": false,
                  "selections": [
                    {
                      "alias": null,
                      "args": null,
                      "concreteType": "unpublished_field_pipeline_datasource_mapping_aggregate_fields",
                      "kind": "LinkedField",
                      "name": "aggregate",
                      "plural": false,
                      "selections": [
                        {
                          "alias": null,
                          "args": null,
                          "kind": "ScalarField",
                          "name": "count",
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
            },
            (v0/*: any*/),
            {
              "alias": "latestFileSummary",
              "args": [
                (v1/*: any*/),
                {
                  "kind": "Literal",
                  "name": "order_by",
                  "value": {
                    "last_modified": "desc"
                  }
                }
              ],
              "concreteType": "data_upload_file_summary",
              "kind": "LinkedField",
              "name": "data_upload_file_summaries",
              "plural": true,
              "selections": [
                (v0/*: any*/)
              ],
              "storageKey": "data_upload_file_summaries(limit:1,order_by:{\"last_modified\":\"desc\"})"
            },
            {
              "alias": "dataprepFlow",
              "args": null,
              "concreteType": "dataprep_flow",
              "kind": "LinkedField",
              "name": "dataprep_flow",
              "plural": false,
              "selections": [
                {
                  "alias": "dataprepJobs",
                  "args": [
                    (v1/*: any*/),
                    {
                      "kind": "Literal",
                      "name": "order_by",
                      "value": {
                        "created": "desc"
                      }
                    }
                  ],
                  "concreteType": "dataprep_job",
                  "kind": "LinkedField",
                  "name": "dataprep_jobs",
                  "plural": true,
                  "selections": [
                    {
                      "alias": "lastModifiedOnDataprep",
                      "args": null,
                      "kind": "ScalarField",
                      "name": "last_modified_on_dataprep",
                      "storageKey": null
                    },
                    {
                      "alias": null,
                      "args": null,
                      "kind": "ScalarField",
                      "name": "status",
                      "storageKey": null
                    }
                  ],
                  "storageKey": "dataprep_jobs(limit:1,order_by:{\"created\":\"desc\"})"
                }
              ],
              "storageKey": null
            },
            {
              "args": null,
              "kind": "FragmentSpread",
              "name": "ActionCell_selfServeSource"
            }
          ],
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "self_serve_sourceConnection",
  "abstractKey": null
};
})();
// prettier-ignore
(node/*: any*/).hash = 'f15798eb9ffbf8cf29960b4ca0b9e7d1';

export default node;
