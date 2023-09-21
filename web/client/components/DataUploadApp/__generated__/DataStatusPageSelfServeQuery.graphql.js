/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
type DataprepSetUp_pipelineDatasourceConnection$ref = any;
type SourceTable_selfServeSource$ref = any;
type useDimensionList_dimensionConnection$ref = any;
type useFieldHierarchy_categoryConnection$ref = any;
type useFieldHierarchy_fieldConnection$ref = any;
export type DataStatusPageSelfServeQueryVariables = {||};
export type DataStatusPageSelfServeQueryResponse = {|
  +selfServeSourceConnection: {|
    +edges: $ReadOnlyArray<{|
      +node: {|
        +sourceId: string
      |}
    |}>,
    +$fragmentRefs: SourceTable_selfServeSource$ref,
  |},
  +fieldConnection: {|
    +$fragmentRefs: useFieldHierarchy_fieldConnection$ref
  |},
  +categoryConnection: {|
    +$fragmentRefs: useFieldHierarchy_categoryConnection$ref
  |},
  +dimensionConnection: {|
    +$fragmentRefs: useDimensionList_dimensionConnection$ref
  |},
  +pipelineDatasourceConnection: {|
    +$fragmentRefs: DataprepSetUp_pipelineDatasourceConnection$ref
  |},
|};
export type DataStatusPageSelfServeQuery = {|
  variables: DataStatusPageSelfServeQueryVariables,
  response: DataStatusPageSelfServeQueryResponse,
|};
*/


/*
query DataStatusPageSelfServeQuery {
  selfServeSourceConnection: self_serve_source_connection {
    edges {
      node {
        sourceId: source_id
        id
      }
    }
    ...SourceTable_selfServeSource
  }
  fieldConnection: field_connection {
    ...useFieldHierarchy_fieldConnection
  }
  categoryConnection: category_connection {
    ...useFieldHierarchy_categoryConnection
  }
  dimensionConnection: dimension_connection {
    ...useDimensionList_dimensionConnection
  }
  pipelineDatasourceConnection: pipeline_datasource_connection {
    ...DataprepSetUp_pipelineDatasourceConnection
  }
}

fragment ActionCell_selfServeSource on self_serve_source {
  id
  sourceId: source_id
  pipelineDatasource: pipeline_datasource {
    name
    id
  }
  latestFileSummary: data_upload_file_summaries(order_by: {last_modified: desc}, limit: 1) {
    lastModified: last_modified
    id
  }
  sourceLastModified: last_modified
  dataUploadFileSummaries: data_upload_file_summaries {
    id
    filePath: file_path
    userFileName: user_file_name
    columnMapping: column_mapping
    lastModified: last_modified
  }
  dataprepFlow: dataprep_flow {
    id
    appendable
    expectedColumns: expected_columns
    dataprepJobs: dataprep_jobs(limit: 1, order_by: {created: desc}) {
      jobId: job_id
      status
      id
    }
    recipeId: recipe_id
  }
}

fragment DataprepSetUp_pipelineDatasourceConnection on pipeline_datasourceConnection {
  edges {
    node {
      id
      name
    }
  }
}

fragment SourceTable_selfServeSource on self_serve_sourceConnection {
  edges {
    node {
      sourceId: source_id
      pipelineDatasource: pipeline_datasource {
        name
        unpublishedFieldsCount: unpublished_field_pipeline_datasource_mappings_aggregate {
          aggregate {
            count
          }
        }
        id
      }
      lastModified: last_modified
      latestFileSummary: data_upload_file_summaries(order_by: {last_modified: desc}, limit: 1) {
        lastModified: last_modified
        id
      }
      dataprepFlow: dataprep_flow {
        dataprepJobs: dataprep_jobs(limit: 1, order_by: {created: desc}) {
          lastModifiedOnDataprep: last_modified_on_dataprep
          status
          id
        }
        id
      }
      ...ActionCell_selfServeSource
      id
    }
  }
}

fragment useDimensionList_dimensionConnection on dimensionConnection {
  edges {
    node {
      id
      name
      dimensionCategoryMappings: dimension_category_mappings {
        category: dimension_category {
          name
          id
        }
        id
      }
    }
  }
}

fragment useFieldHierarchy_categoryConnection on categoryConnection {
  edges {
    node {
      id
      name
      parent {
        id
      }
      visibilityStatus: visibility_status
    }
  }
}

fragment useFieldHierarchy_fieldConnection on fieldConnection {
  edges {
    node {
      id
      name
      serializedCalculation: calculation
      shortName: short_name
      fieldCategoryMappings: field_category_mappings {
        category {
          id
        }
        visibilityStatus: visibility_status
        id
      }
      fieldDimensionMappings: field_dimension_mappings {
        dimension {
          id
        }
        id
      }
    }
  }
}
*/

const node/*: ConcreteRequest*/ = (function(){
var v0 = {
  "alias": "sourceId",
  "args": null,
  "kind": "ScalarField",
  "name": "source_id",
  "storageKey": null
},
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v3 = {
  "alias": "lastModified",
  "args": null,
  "kind": "ScalarField",
  "name": "last_modified",
  "storageKey": null
},
v4 = {
  "kind": "Literal",
  "name": "limit",
  "value": 1
},
v5 = [
  (v1/*: any*/)
],
v6 = {
  "alias": "visibilityStatus",
  "args": null,
  "kind": "ScalarField",
  "name": "visibility_status",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "DataStatusPageSelfServeQuery",
    "selections": [
      {
        "alias": "selfServeSourceConnection",
        "args": null,
        "concreteType": "self_serve_sourceConnection",
        "kind": "LinkedField",
        "name": "self_serve_source_connection",
        "plural": false,
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
                  (v0/*: any*/)
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          },
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "SourceTable_selfServeSource"
          }
        ],
        "storageKey": null
      },
      {
        "alias": "fieldConnection",
        "args": null,
        "concreteType": "fieldConnection",
        "kind": "LinkedField",
        "name": "field_connection",
        "plural": false,
        "selections": [
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "useFieldHierarchy_fieldConnection"
          }
        ],
        "storageKey": null
      },
      {
        "alias": "categoryConnection",
        "args": null,
        "concreteType": "categoryConnection",
        "kind": "LinkedField",
        "name": "category_connection",
        "plural": false,
        "selections": [
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "useFieldHierarchy_categoryConnection"
          }
        ],
        "storageKey": null
      },
      {
        "alias": "dimensionConnection",
        "args": null,
        "concreteType": "dimensionConnection",
        "kind": "LinkedField",
        "name": "dimension_connection",
        "plural": false,
        "selections": [
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "useDimensionList_dimensionConnection"
          }
        ],
        "storageKey": null
      },
      {
        "alias": "pipelineDatasourceConnection",
        "args": null,
        "concreteType": "pipeline_datasourceConnection",
        "kind": "LinkedField",
        "name": "pipeline_datasource_connection",
        "plural": false,
        "selections": [
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "DataprepSetUp_pipelineDatasourceConnection"
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
    "name": "DataStatusPageSelfServeQuery",
    "selections": [
      {
        "alias": "selfServeSourceConnection",
        "args": null,
        "concreteType": "self_serve_sourceConnection",
        "kind": "LinkedField",
        "name": "self_serve_source_connection",
        "plural": false,
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
                  (v0/*: any*/),
                  (v1/*: any*/),
                  {
                    "alias": "pipelineDatasource",
                    "args": null,
                    "concreteType": "pipeline_datasource",
                    "kind": "LinkedField",
                    "name": "pipeline_datasource",
                    "plural": false,
                    "selections": [
                      (v2/*: any*/),
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
                      },
                      (v1/*: any*/)
                    ],
                    "storageKey": null
                  },
                  (v3/*: any*/),
                  {
                    "alias": "latestFileSummary",
                    "args": [
                      (v4/*: any*/),
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
                      (v3/*: any*/),
                      (v1/*: any*/)
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
                          (v4/*: any*/),
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
                          },
                          (v1/*: any*/),
                          {
                            "alias": "jobId",
                            "args": null,
                            "kind": "ScalarField",
                            "name": "job_id",
                            "storageKey": null
                          }
                        ],
                        "storageKey": "dataprep_jobs(limit:1,order_by:{\"created\":\"desc\"})"
                      },
                      (v1/*: any*/),
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
                        "alias": "recipeId",
                        "args": null,
                        "kind": "ScalarField",
                        "name": "recipe_id",
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
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
                      (v1/*: any*/),
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
        "storageKey": null
      },
      {
        "alias": "fieldConnection",
        "args": null,
        "concreteType": "fieldConnection",
        "kind": "LinkedField",
        "name": "field_connection",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "fieldEdge",
            "kind": "LinkedField",
            "name": "edges",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "field",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  (v1/*: any*/),
                  (v2/*: any*/),
                  {
                    "alias": "serializedCalculation",
                    "args": null,
                    "kind": "ScalarField",
                    "name": "calculation",
                    "storageKey": null
                  },
                  {
                    "alias": "shortName",
                    "args": null,
                    "kind": "ScalarField",
                    "name": "short_name",
                    "storageKey": null
                  },
                  {
                    "alias": "fieldCategoryMappings",
                    "args": null,
                    "concreteType": "field_category_mapping",
                    "kind": "LinkedField",
                    "name": "field_category_mappings",
                    "plural": true,
                    "selections": [
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "category",
                        "kind": "LinkedField",
                        "name": "category",
                        "plural": false,
                        "selections": (v5/*: any*/),
                        "storageKey": null
                      },
                      (v6/*: any*/),
                      (v1/*: any*/)
                    ],
                    "storageKey": null
                  },
                  {
                    "alias": "fieldDimensionMappings",
                    "args": null,
                    "concreteType": "field_dimension_mapping",
                    "kind": "LinkedField",
                    "name": "field_dimension_mappings",
                    "plural": true,
                    "selections": [
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "dimension",
                        "kind": "LinkedField",
                        "name": "dimension",
                        "plural": false,
                        "selections": (v5/*: any*/),
                        "storageKey": null
                      },
                      (v1/*: any*/)
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
        "storageKey": null
      },
      {
        "alias": "categoryConnection",
        "args": null,
        "concreteType": "categoryConnection",
        "kind": "LinkedField",
        "name": "category_connection",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "categoryEdge",
            "kind": "LinkedField",
            "name": "edges",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "category",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  (v1/*: any*/),
                  (v2/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "category",
                    "kind": "LinkedField",
                    "name": "parent",
                    "plural": false,
                    "selections": (v5/*: any*/),
                    "storageKey": null
                  },
                  (v6/*: any*/)
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
        "alias": "dimensionConnection",
        "args": null,
        "concreteType": "dimensionConnection",
        "kind": "LinkedField",
        "name": "dimension_connection",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "dimensionEdge",
            "kind": "LinkedField",
            "name": "edges",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "dimension",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  (v1/*: any*/),
                  (v2/*: any*/),
                  {
                    "alias": "dimensionCategoryMappings",
                    "args": null,
                    "concreteType": "dimension_category_mapping",
                    "kind": "LinkedField",
                    "name": "dimension_category_mappings",
                    "plural": true,
                    "selections": [
                      {
                        "alias": "category",
                        "args": null,
                        "concreteType": "dimension_category",
                        "kind": "LinkedField",
                        "name": "dimension_category",
                        "plural": false,
                        "selections": [
                          (v2/*: any*/),
                          (v1/*: any*/)
                        ],
                        "storageKey": null
                      },
                      (v1/*: any*/)
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
        "storageKey": null
      },
      {
        "alias": "pipelineDatasourceConnection",
        "args": null,
        "concreteType": "pipeline_datasourceConnection",
        "kind": "LinkedField",
        "name": "pipeline_datasource_connection",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "pipeline_datasourceEdge",
            "kind": "LinkedField",
            "name": "edges",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "pipeline_datasource",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  (v1/*: any*/),
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
    ]
  },
  "params": {
    "cacheID": "848a309cb2c198a2df274e7fb7801618",
    "id": null,
    "metadata": {},
    "name": "DataStatusPageSelfServeQuery",
    "operationKind": "query",
    "text": "query DataStatusPageSelfServeQuery {\n  selfServeSourceConnection: self_serve_source_connection {\n    edges {\n      node {\n        sourceId: source_id\n        id\n      }\n    }\n    ...SourceTable_selfServeSource\n  }\n  fieldConnection: field_connection {\n    ...useFieldHierarchy_fieldConnection\n  }\n  categoryConnection: category_connection {\n    ...useFieldHierarchy_categoryConnection\n  }\n  dimensionConnection: dimension_connection {\n    ...useDimensionList_dimensionConnection\n  }\n  pipelineDatasourceConnection: pipeline_datasource_connection {\n    ...DataprepSetUp_pipelineDatasourceConnection\n  }\n}\n\nfragment ActionCell_selfServeSource on self_serve_source {\n  id\n  sourceId: source_id\n  pipelineDatasource: pipeline_datasource {\n    name\n    id\n  }\n  latestFileSummary: data_upload_file_summaries(order_by: {last_modified: desc}, limit: 1) {\n    lastModified: last_modified\n    id\n  }\n  sourceLastModified: last_modified\n  dataUploadFileSummaries: data_upload_file_summaries {\n    id\n    filePath: file_path\n    userFileName: user_file_name\n    columnMapping: column_mapping\n    lastModified: last_modified\n  }\n  dataprepFlow: dataprep_flow {\n    id\n    appendable\n    expectedColumns: expected_columns\n    dataprepJobs: dataprep_jobs(limit: 1, order_by: {created: desc}) {\n      jobId: job_id\n      status\n      id\n    }\n    recipeId: recipe_id\n  }\n}\n\nfragment DataprepSetUp_pipelineDatasourceConnection on pipeline_datasourceConnection {\n  edges {\n    node {\n      id\n      name\n    }\n  }\n}\n\nfragment SourceTable_selfServeSource on self_serve_sourceConnection {\n  edges {\n    node {\n      sourceId: source_id\n      pipelineDatasource: pipeline_datasource {\n        name\n        unpublishedFieldsCount: unpublished_field_pipeline_datasource_mappings_aggregate {\n          aggregate {\n            count\n          }\n        }\n        id\n      }\n      lastModified: last_modified\n      latestFileSummary: data_upload_file_summaries(order_by: {last_modified: desc}, limit: 1) {\n        lastModified: last_modified\n        id\n      }\n      dataprepFlow: dataprep_flow {\n        dataprepJobs: dataprep_jobs(limit: 1, order_by: {created: desc}) {\n          lastModifiedOnDataprep: last_modified_on_dataprep\n          status\n          id\n        }\n        id\n      }\n      ...ActionCell_selfServeSource\n      id\n    }\n  }\n}\n\nfragment useDimensionList_dimensionConnection on dimensionConnection {\n  edges {\n    node {\n      id\n      name\n      dimensionCategoryMappings: dimension_category_mappings {\n        category: dimension_category {\n          name\n          id\n        }\n        id\n      }\n    }\n  }\n}\n\nfragment useFieldHierarchy_categoryConnection on categoryConnection {\n  edges {\n    node {\n      id\n      name\n      parent {\n        id\n      }\n      visibilityStatus: visibility_status\n    }\n  }\n}\n\nfragment useFieldHierarchy_fieldConnection on fieldConnection {\n  edges {\n    node {\n      id\n      name\n      serializedCalculation: calculation\n      shortName: short_name\n      fieldCategoryMappings: field_category_mappings {\n        category {\n          id\n        }\n        visibilityStatus: visibility_status\n        id\n      }\n      fieldDimensionMappings: field_dimension_mappings {\n        dimension {\n          id\n        }\n        id\n      }\n    }\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = 'c122e6bd874634c9a147a9637cb14de0';

export default node;
