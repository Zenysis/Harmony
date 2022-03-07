/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
type UnpublishedFieldTableRows_unpublishedField$ref = any;
export type UnpublishedFieldTableRowsQueryVariables = {|
  pageSize: number,
  searchText: string,
|};
export type UnpublishedFieldTableRowsQueryResponse = {|
  +$fragmentRefs: UnpublishedFieldTableRows_unpublishedField$ref
|};
export type UnpublishedFieldTableRowsQuery = {|
  variables: UnpublishedFieldTableRowsQueryVariables,
  response: UnpublishedFieldTableRowsQueryResponse,
|};
*/


/*
query UnpublishedFieldTableRowsQuery(
  $pageSize: Int!
  $searchText: String!
) {
  ...UnpublishedFieldTableRows_unpublishedField_1FhzkK
}

fragment CalculationInput_unpublishedField on unpublished_field {
  id
  ...useUnpublishedFieldCalculation_unpublishedField
}

fragment CategoryInput_unpublishedField on unpublished_field {
  id
  unpublishedFieldCategoryMappings: unpublished_field_category_mappings {
    category {
      id
      name
    }
    id
  }
}

fragment DatasourceInput_unpublishedField on unpublished_field {
  id
  unpublishedFieldPipelineDatasourceMappings: unpublished_field_pipeline_datasource_mappings {
    datasource: pipeline_datasource {
      id
      name
    }
    id
  }
}

fragment DescriptionInput_unpublishedField on unpublished_field {
  id
  description
}

fragment NameInput_unpublishedField on unpublished_field {
  id
  name
}

fragment ShortNameInput_unpublishedField on unpublished_field {
  id
  shortName: short_name
}

fragment UnpublishedFieldRow_unpublishedField on unpublished_field {
  id
  name
  shortName: short_name
  description
  calculation
  unpublishedFieldCategoryMappings: unpublished_field_category_mappings {
    categoryId: category_id
    id
  }
  unpublishedFieldPipelineDatasourceMappings: unpublished_field_pipeline_datasource_mappings {
    pipelineDatasourceId: pipeline_datasource_id
    id
  }
  ...CalculationInput_unpublishedField
  ...CategoryInput_unpublishedField
  ...DatasourceInput_unpublishedField
  ...DescriptionInput_unpublishedField
  ...NameInput_unpublishedField
  ...ShortNameInput_unpublishedField
}

fragment UnpublishedFieldTableRows_unpublishedField_1FhzkK on query_root {
  unpublishedFieldConnection: unpublished_field_connection(where: {_or: [{id: {_ilike: $searchText}}, {name: {_ilike: $searchText}}, {short_name: {_ilike: $searchText}}, {description: {_ilike: $searchText}}, {unpublished_field_category_mappings: {category: {name: {_ilike: $searchText}}}}, {unpublished_field_pipeline_datasource_mappings: {pipeline_datasource: {name: {_ilike: $searchText}}}}]}, first: $pageSize) {
    edges {
      node {
        id
        ...UnpublishedFieldRow_unpublishedField
        __typename
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}

fragment useUnpublishedFieldCalculation_unpublishedField on unpublished_field {
  serializedCalculation: calculation
}
*/

const node/*: ConcreteRequest*/ = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "pageSize"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "searchText"
  }
],
v1 = {
  "kind": "Variable",
  "name": "first",
  "variableName": "pageSize"
},
v2 = [
  {
    "kind": "Variable",
    "name": "_ilike",
    "variableName": "searchText"
  }
],
v3 = [
  {
    "fields": (v2/*: any*/),
    "kind": "ObjectValue",
    "name": "name"
  }
],
v4 = [
  (v1/*: any*/),
  {
    "fields": [
      {
        "items": [
          {
            "fields": [
              {
                "fields": (v2/*: any*/),
                "kind": "ObjectValue",
                "name": "id"
              }
            ],
            "kind": "ObjectValue",
            "name": "_or.0"
          },
          {
            "fields": (v3/*: any*/),
            "kind": "ObjectValue",
            "name": "_or.1"
          },
          {
            "fields": [
              {
                "fields": (v2/*: any*/),
                "kind": "ObjectValue",
                "name": "short_name"
              }
            ],
            "kind": "ObjectValue",
            "name": "_or.2"
          },
          {
            "fields": [
              {
                "fields": (v2/*: any*/),
                "kind": "ObjectValue",
                "name": "description"
              }
            ],
            "kind": "ObjectValue",
            "name": "_or.3"
          },
          {
            "fields": [
              {
                "fields": [
                  {
                    "fields": (v3/*: any*/),
                    "kind": "ObjectValue",
                    "name": "category"
                  }
                ],
                "kind": "ObjectValue",
                "name": "unpublished_field_category_mappings"
              }
            ],
            "kind": "ObjectValue",
            "name": "_or.4"
          },
          {
            "fields": [
              {
                "fields": [
                  {
                    "fields": (v3/*: any*/),
                    "kind": "ObjectValue",
                    "name": "pipeline_datasource"
                  }
                ],
                "kind": "ObjectValue",
                "name": "unpublished_field_pipeline_datasource_mappings"
              }
            ],
            "kind": "ObjectValue",
            "name": "_or.5"
          }
        ],
        "kind": "ListValue",
        "name": "_or"
      }
    ],
    "kind": "ObjectValue",
    "name": "where"
  }
],
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v7 = [
  (v5/*: any*/),
  (v6/*: any*/)
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "UnpublishedFieldTableRowsQuery",
    "selections": [
      {
        "args": [
          (v1/*: any*/),
          {
            "kind": "Variable",
            "name": "searchText",
            "variableName": "searchText"
          }
        ],
        "kind": "FragmentSpread",
        "name": "UnpublishedFieldTableRows_unpublishedField"
      }
    ],
    "type": "query_root",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "UnpublishedFieldTableRowsQuery",
    "selections": [
      {
        "alias": "unpublishedFieldConnection",
        "args": (v4/*: any*/),
        "concreteType": "unpublished_fieldConnection",
        "kind": "LinkedField",
        "name": "unpublished_field_connection",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "unpublished_fieldEdge",
            "kind": "LinkedField",
            "name": "edges",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "unpublished_field",
                "kind": "LinkedField",
                "name": "node",
                "plural": false,
                "selections": [
                  (v5/*: any*/),
                  (v6/*: any*/),
                  {
                    "alias": "shortName",
                    "args": null,
                    "kind": "ScalarField",
                    "name": "short_name",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "description",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "calculation",
                    "storageKey": null
                  },
                  {
                    "alias": "unpublishedFieldCategoryMappings",
                    "args": null,
                    "concreteType": "unpublished_field_category_mapping",
                    "kind": "LinkedField",
                    "name": "unpublished_field_category_mappings",
                    "plural": true,
                    "selections": [
                      {
                        "alias": "categoryId",
                        "args": null,
                        "kind": "ScalarField",
                        "name": "category_id",
                        "storageKey": null
                      },
                      (v5/*: any*/),
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "category",
                        "kind": "LinkedField",
                        "name": "category",
                        "plural": false,
                        "selections": (v7/*: any*/),
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
                  },
                  {
                    "alias": "unpublishedFieldPipelineDatasourceMappings",
                    "args": null,
                    "concreteType": "unpublished_field_pipeline_datasource_mapping",
                    "kind": "LinkedField",
                    "name": "unpublished_field_pipeline_datasource_mappings",
                    "plural": true,
                    "selections": [
                      {
                        "alias": "pipelineDatasourceId",
                        "args": null,
                        "kind": "ScalarField",
                        "name": "pipeline_datasource_id",
                        "storageKey": null
                      },
                      (v5/*: any*/),
                      {
                        "alias": "datasource",
                        "args": null,
                        "concreteType": "pipeline_datasource",
                        "kind": "LinkedField",
                        "name": "pipeline_datasource",
                        "plural": false,
                        "selections": (v7/*: any*/),
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
                  },
                  {
                    "alias": "serializedCalculation",
                    "args": null,
                    "kind": "ScalarField",
                    "name": "calculation",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "__typename",
                    "storageKey": null
                  }
                ],
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "cursor",
                "storageKey": null
              }
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "PageInfo",
            "kind": "LinkedField",
            "name": "pageInfo",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "hasNextPage",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "endCursor",
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      {
        "alias": "unpublishedFieldConnection",
        "args": (v4/*: any*/),
        "filters": [
          "where"
        ],
        "handle": "connection",
        "key": "UnpublishedFieldTableRows_unpublishedFieldConnection",
        "kind": "LinkedHandle",
        "name": "unpublished_field_connection"
      }
    ]
  },
  "params": {
    "cacheID": "27e870ef581fa710165d5168759e8556",
    "id": null,
    "metadata": {},
    "name": "UnpublishedFieldTableRowsQuery",
    "operationKind": "query",
    "text": "query UnpublishedFieldTableRowsQuery(\n  $pageSize: Int!\n  $searchText: String!\n) {\n  ...UnpublishedFieldTableRows_unpublishedField_1FhzkK\n}\n\nfragment CalculationInput_unpublishedField on unpublished_field {\n  id\n  ...useUnpublishedFieldCalculation_unpublishedField\n}\n\nfragment CategoryInput_unpublishedField on unpublished_field {\n  id\n  unpublishedFieldCategoryMappings: unpublished_field_category_mappings {\n    category {\n      id\n      name\n    }\n    id\n  }\n}\n\nfragment DatasourceInput_unpublishedField on unpublished_field {\n  id\n  unpublishedFieldPipelineDatasourceMappings: unpublished_field_pipeline_datasource_mappings {\n    datasource: pipeline_datasource {\n      id\n      name\n    }\n    id\n  }\n}\n\nfragment DescriptionInput_unpublishedField on unpublished_field {\n  id\n  description\n}\n\nfragment NameInput_unpublishedField on unpublished_field {\n  id\n  name\n}\n\nfragment ShortNameInput_unpublishedField on unpublished_field {\n  id\n  shortName: short_name\n}\n\nfragment UnpublishedFieldRow_unpublishedField on unpublished_field {\n  id\n  name\n  shortName: short_name\n  description\n  calculation\n  unpublishedFieldCategoryMappings: unpublished_field_category_mappings {\n    categoryId: category_id\n    id\n  }\n  unpublishedFieldPipelineDatasourceMappings: unpublished_field_pipeline_datasource_mappings {\n    pipelineDatasourceId: pipeline_datasource_id\n    id\n  }\n  ...CalculationInput_unpublishedField\n  ...CategoryInput_unpublishedField\n  ...DatasourceInput_unpublishedField\n  ...DescriptionInput_unpublishedField\n  ...NameInput_unpublishedField\n  ...ShortNameInput_unpublishedField\n}\n\nfragment UnpublishedFieldTableRows_unpublishedField_1FhzkK on query_root {\n  unpublishedFieldConnection: unpublished_field_connection(where: {_or: [{id: {_ilike: $searchText}}, {name: {_ilike: $searchText}}, {short_name: {_ilike: $searchText}}, {description: {_ilike: $searchText}}, {unpublished_field_category_mappings: {category: {name: {_ilike: $searchText}}}}, {unpublished_field_pipeline_datasource_mappings: {pipeline_datasource: {name: {_ilike: $searchText}}}}]}, first: $pageSize) {\n    edges {\n      node {\n        id\n        ...UnpublishedFieldRow_unpublishedField\n        __typename\n      }\n      cursor\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n  }\n}\n\nfragment useUnpublishedFieldCalculation_unpublishedField on unpublished_field {\n  serializedCalculation: calculation\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = '933494677fcfce7f19768c7e88a841c2';

export default node;
