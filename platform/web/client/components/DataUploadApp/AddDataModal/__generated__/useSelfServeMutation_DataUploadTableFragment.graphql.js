/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type ActionCell_selfServeSource$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type useSelfServeMutation_DataUploadTableFragment$ref: FragmentReference;
declare export opaque type useSelfServeMutation_DataUploadTableFragment$fragmentType: useSelfServeMutation_DataUploadTableFragment$ref;
export type useSelfServeMutation_DataUploadTableFragment = {|
  +pipelineDatasource: {|
    +id: string,
    +unpublishedFieldsCount: {|
      +aggregate: ?{|
        +count: number
      |}
    |},
  |},
  +dataprepFlow: ?{|
    +dataprepJobs: $ReadOnlyArray<{|
      +lastModifiedOnDataprep: ?any
    |}>
  |},
  +lastModified: any,
  +$fragmentRefs: ActionCell_selfServeSource$ref,
  +$refType: useSelfServeMutation_DataUploadTableFragment$ref,
|};
export type useSelfServeMutation_DataUploadTableFragment$data = useSelfServeMutation_DataUploadTableFragment;
export type useSelfServeMutation_DataUploadTableFragment$key = {
  +$data?: useSelfServeMutation_DataUploadTableFragment$data,
  +$fragmentRefs: useSelfServeMutation_DataUploadTableFragment$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "useSelfServeMutation_DataUploadTableFragment",
  "selections": [
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
          "name": "id",
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
            }
          ],
          "storageKey": "dataprep_jobs(limit:1,order_by:{\"created\":\"desc\"})"
        }
      ],
      "storageKey": null
    },
    {
      "alias": "lastModified",
      "args": null,
      "kind": "ScalarField",
      "name": "last_modified",
      "storageKey": null
    },
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "ActionCell_selfServeSource"
    }
  ],
  "type": "self_serve_source",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = 'ad698f93c7084722327d86efe7c17449';

export default node;
