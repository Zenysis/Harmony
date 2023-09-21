/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
import type { FragmentReference } from "relay-runtime";
declare export opaque type ActionCell_selfServeSource$ref: FragmentReference;
declare export opaque type ActionCell_selfServeSource$fragmentType: ActionCell_selfServeSource$ref;
export type ActionCell_selfServeSource = {|
  +id: string,
  +sourceId: string,
  +pipelineDatasource: {|
    +name: string
  |},
  +latestFileSummary: $ReadOnlyArray<{|
    +lastModified: any
  |}>,
  +sourceLastModified: any,
  +dataUploadFileSummaries: $ReadOnlyArray<{|
    +id: string,
    +filePath: string,
    +userFileName: string,
    +columnMapping: any,
    +lastModified: any,
  |}>,
  +dataprepFlow: ?{|
    +id: string,
    +appendable: boolean,
    +expectedColumns: any,
    +dataprepJobs: $ReadOnlyArray<{|
      +jobId: ?number,
      +status: ?string,
    |}>,
    +recipeId: number,
  |},
  +$refType: ActionCell_selfServeSource$ref,
|};
export type ActionCell_selfServeSource$data = ActionCell_selfServeSource;
export type ActionCell_selfServeSource$key = {
  +$data?: ActionCell_selfServeSource$data,
  +$fragmentRefs: ActionCell_selfServeSource$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v1 = {
  "kind": "Literal",
  "name": "limit",
  "value": 1
},
v2 = {
  "alias": "lastModified",
  "args": null,
  "kind": "ScalarField",
  "name": "last_modified",
  "storageKey": null
};
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "ActionCell_selfServeSource",
  "selections": [
    (v0/*: any*/),
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
        }
      ],
      "storageKey": null
    },
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
        (v2/*: any*/)
      ],
      "storageKey": "data_upload_file_summaries(limit:1,order_by:{\"last_modified\":\"desc\"})"
    },
    {
      "alias": "sourceLastModified",
      "args": null,
      "kind": "ScalarField",
      "name": "last_modified",
      "storageKey": null
    },
    {
      "alias": "dataUploadFileSummaries",
      "args": null,
      "concreteType": "data_upload_file_summary",
      "kind": "LinkedField",
      "name": "data_upload_file_summaries",
      "plural": true,
      "selections": [
        (v0/*: any*/),
        {
          "alias": "filePath",
          "args": null,
          "kind": "ScalarField",
          "name": "file_path",
          "storageKey": null
        },
        {
          "alias": "userFileName",
          "args": null,
          "kind": "ScalarField",
          "name": "user_file_name",
          "storageKey": null
        },
        {
          "alias": "columnMapping",
          "args": null,
          "kind": "ScalarField",
          "name": "column_mapping",
          "storageKey": null
        },
        (v2/*: any*/)
      ],
      "storageKey": null
    },
    {
      "alias": "dataprepFlow",
      "args": null,
      "concreteType": "dataprep_flow",
      "kind": "LinkedField",
      "name": "dataprep_flow",
      "plural": false,
      "selections": [
        (v0/*: any*/),
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "appendable",
          "storageKey": null
        },
        {
          "alias": "expectedColumns",
          "args": null,
          "kind": "ScalarField",
          "name": "expected_columns",
          "storageKey": null
        },
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
              "alias": "jobId",
              "args": null,
              "kind": "ScalarField",
              "name": "job_id",
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
        },
        {
          "alias": "recipeId",
          "args": null,
          "kind": "ScalarField",
          "name": "recipe_id",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "self_serve_source",
  "abstractKey": null
};
})();
// prettier-ignore
(node/*: any*/).hash = '6700150b80e01ea3ac8c9ae13e2eec06';

export default node;
