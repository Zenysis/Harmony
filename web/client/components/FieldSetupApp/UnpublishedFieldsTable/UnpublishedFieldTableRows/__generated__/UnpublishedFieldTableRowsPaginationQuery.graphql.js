/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
type UnpublishedFieldTableRows_unpublishedField$ref = any;
export type UnpublishedFieldTableRowsPaginationQueryVariables = {|
  after?: ?string,
  first: number,
  searchText: string,
|};
export type UnpublishedFieldTableRowsPaginationQueryResponse = {|
  +$fragmentRefs: UnpublishedFieldTableRows_unpublishedField$ref
|};
export type UnpublishedFieldTableRowsPaginationQuery = {|
  variables: UnpublishedFieldTableRowsPaginationQueryVariables,
  response: UnpublishedFieldTableRowsPaginationQueryResponse,
|};
*/


/*
query UnpublishedFieldTableRowsPaginationQuery(
  $after: String
  $first: Int!
  $searchText: String!
) {
  ...UnpublishedFieldTableRows_unpublishedField_2yyznZ
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

fragment UnpublishedFieldTableRows_unpublishedField_2yyznZ on query_root {
  unpublishedFieldConnection: unpublished_field_connection(where: {_or: [{id: {_ilike: $searchText}}, {name: {_ilike: $searchText}}, {short_name: {_ilike: $searchText}}, {description: {_ilike: $searchText}}, {unpublished_field_category_mappings: {category: {name: {_ilike: $searchText}}}}, {unpublished_field_pipeline_datasource_mappings: {pipeline_datasource: {name: {_ilike: $searchText}}}}]}, first: $first, after: $after) {
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
    "name": "after"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "first"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "searchText"
  }
],
v1 = {
  "kind": "Variable",
  "name": "after",
  "variableName": "after"
},
v2 = {
  "kind": "Variable",
  "name": "first",
  "variableName": "first"
},
v3 = [
  {
    "kind": "Variable",
    "name": "_ilike",
    "variableName": "searchText"
  }
],
v4 = [
  {
    "fields": (v3/*: any*/),
    "kind": "ObjectValue",
    "name": "name"
  }
],
v5 = [
  (v1/*: any*/),
  (v2/*: any*/),
  {
    "fields": [
      {
        "items": [
          {
            "fields": [
              {
                "fields": (v3/*: any*/),
                "kind": "ObjectValue",
                "name": "id"
              }
            ],
            "kind": "ObjectValue",
            "name": "_or.0"
          },
          {
            "fields": (v4/*: any*/),
            "kind": "ObjectValue",
            "name": "_or.1"
          },
          {
            "fields": [
              {
                "fields": (v3/*: any*/),
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
                "fields": (v3/*: any*/),
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
                    "fields": (v4/*: any*/),
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
                    "fields": (v4/*: any*/),
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
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v8 = [
  (v6/*: any*/),
  (v7/*: any*/)
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "UnpublishedFieldTableRowsPaginationQuery",
    "selections": [
      {
        "args": [
          (v1/*: any*/),
          (v2/*: any*/),
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
    "name": "UnpublishedFieldTableRowsPaginationQuery",
    "selections": [
      {
        "alias": "unpublishedFieldConnection",
        "args": (v5/*: any*/),
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
                  (v6/*: any*/),
                  (v7/*: any*/),
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
                      (v6/*: any*/),
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "category",
                        "kind": "LinkedField",
                        "name": "category",
                        "plural": false,
                        "selections": (v8/*: any*/),
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
                      (v6/*: any*/),
                      {
                        "alias": "datasource",
                        "args": null,
                        "concreteType": "pipeline_datasource",
                        "kind": "LinkedField",
                        "name": "pipeline_datasource",
                        "plural": false,
                        "selections": (v8/*: any*/),
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
        "args": (v5/*: any*/),
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
    "cacheID": "9e44e785fcae4cac40bd04ae7b6a3769",
    "id": null,
    "metadata": {},
    "name": "UnpublishedFieldTableRowsPaginationQuery",
    "operationKind": "query",
    "text": "query UnpublishedFieldTableRowsPaginationQuery(\n  $after: String\n  $first: Int!\n  $searchText: String!\n) {\n  ...UnpublishedFieldTableRows_unpublishedField_2yyznZ\n}\n\nfragment CalculationInput_unpublishedField on unpublished_field {\n  id\n  ...useUnpublishedFieldCalculation_unpublishedField\n}\n\nfragment CategoryInput_unpublishedField on unpublished_field {\n  id\n  unpublishedFieldCategoryMappings: unpublished_field_category_mappings {\n    category {\n      id\n      name\n    }\n    id\n  }\n}\n\nfragment DatasourceInput_unpublishedField on unpublished_field {\n  id\n  unpublishedFieldPipelineDatasourceMappings: unpublished_field_pipeline_datasource_mappings {\n    datasource: pipeline_datasource {\n      id\n      name\n    }\n    id\n  }\n}\n\nfragment DescriptionInput_unpublishedField on unpublished_field {\n  id\n  description\n}\n\nfragment NameInput_unpublishedField on unpublished_field {\n  id\n  name\n}\n\nfragment ShortNameInput_unpublishedField on unpublished_field {\n  id\n  shortName: short_name\n}\n\nfragment UnpublishedFieldRow_unpublishedField on unpublished_field {\n  id\n  name\n  shortName: short_name\n  description\n  calculation\n  unpublishedFieldCategoryMappings: unpublished_field_category_mappings {\n    categoryId: category_id\n    id\n  }\n  unpublishedFieldPipelineDatasourceMappings: unpublished_field_pipeline_datasource_mappings {\n    pipelineDatasourceId: pipeline_datasource_id\n    id\n  }\n  ...CalculationInput_unpublishedField\n  ...CategoryInput_unpublishedField\n  ...DatasourceInput_unpublishedField\n  ...DescriptionInput_unpublishedField\n  ...NameInput_unpublishedField\n  ...ShortNameInput_unpublishedField\n}\n\nfragment UnpublishedFieldTableRows_unpublishedField_2yyznZ on query_root {\n  unpublishedFieldConnection: unpublished_field_connection(where: {_or: [{id: {_ilike: $searchText}}, {name: {_ilike: $searchText}}, {short_name: {_ilike: $searchText}}, {description: {_ilike: $searchText}}, {unpublished_field_category_mappings: {category: {name: {_ilike: $searchText}}}}, {unpublished_field_pipeline_datasource_mappings: {pipeline_datasource: {name: {_ilike: $searchText}}}}]}, first: $first, after: $after) {\n    edges {\n      node {\n        id\n        ...UnpublishedFieldRow_unpublishedField\n        __typename\n      }\n      cursor\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n  }\n}\n\nfragment useUnpublishedFieldCalculation_unpublishedField on unpublished_field {\n  serializedCalculation: calculation\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = '4cad595bc5bc482c0a55202511eae1d6';

export default node;
