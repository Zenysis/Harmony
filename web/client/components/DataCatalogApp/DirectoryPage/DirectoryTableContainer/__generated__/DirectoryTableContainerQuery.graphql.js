/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
type DirectoryTable_category$ref = any;
export type DirectoryTableContainerQueryVariables = {|
  id: string
|};
export type DirectoryTableContainerQueryResponse = {|
  +node: ?{|
    +children?: $ReadOnlyArray<{|
      +id: string
    |}>,
    +fieldCategoryMappings?: $ReadOnlyArray<{|
      +field: {|
        +id: string
      |}
    |}>,
    +$fragmentRefs: DirectoryTable_category$ref,
  |}
|};
export type DirectoryTableContainerQuery = {|
  variables: DirectoryTableContainerQueryVariables,
  response: DirectoryTableContainerQueryResponse,
|};
*/


/*
query DirectoryTableContainerQuery(
  $id: ID!
) {
  node(id: $id) {
    __typename
    ... on category {
      children {
        id
      }
      fieldCategoryMappings: field_category_mappings {
        field {
          id
        }
        id
      }
      ...DirectoryTable_category
    }
    id
  }
}

fragment CategoryGroupRow_category on category {
  id
  name
  visibilityStatus: visibility_status
  ...useCategoryContentCount_category
}

fragment DirectoryTable_category on category {
  children {
    id
    name
    ...CategoryGroupRow_category
  }
  fieldCategoryMappings: field_category_mappings {
    field {
      id
      name
      ...FieldRow_field
    }
    ...FieldRow_fieldCategoryMapping
    id
  }
}

fragment FieldRow_field on field {
  id
  description
  name
  copiedFromFieldId: copied_from_field_id
  fieldPipelineDatasourceMappings: field_pipeline_datasource_mappings {
    pipelineDatasource: pipeline_datasource {
      id
      name
    }
    id
  }
  ...useFieldCalculation_field
}

fragment FieldRow_fieldCategoryMapping on field_category_mapping {
  visibilityStatus: visibility_status
}

fragment useCategoryContentCount_category on category {
  fieldCategoryMappingsAggregate: field_category_mappings_aggregate {
    aggregate {
      count
    }
  }
  childrenCategoryAggregate: children_aggregate {
    aggregate {
      count
    }
  }
}

fragment useFieldCalculation_field on field {
  serializedCalculation: calculation
}
*/

const node/*: ConcreteRequest*/ = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "id"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "id",
    "variableName": "id"
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v3 = [
  (v2/*: any*/)
],
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v5 = {
  "alias": "visibilityStatus",
  "args": null,
  "kind": "ScalarField",
  "name": "visibility_status",
  "storageKey": null
},
v6 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "count",
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "DirectoryTableContainerQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "node",
        "plural": false,
        "selections": [
          {
            "kind": "InlineFragment",
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "category",
                "kind": "LinkedField",
                "name": "children",
                "plural": true,
                "selections": (v3/*: any*/),
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
                    "concreteType": "field",
                    "kind": "LinkedField",
                    "name": "field",
                    "plural": false,
                    "selections": (v3/*: any*/),
                    "storageKey": null
                  }
                ],
                "storageKey": null
              },
              {
                "args": null,
                "kind": "FragmentSpread",
                "name": "DirectoryTable_category"
              }
            ],
            "type": "category",
            "abstractKey": null
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
    "name": "DirectoryTableContainerQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "node",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "__typename",
            "storageKey": null
          },
          (v2/*: any*/),
          {
            "kind": "InlineFragment",
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "category",
                "kind": "LinkedField",
                "name": "children",
                "plural": true,
                "selections": [
                  (v2/*: any*/),
                  (v4/*: any*/),
                  (v5/*: any*/),
                  {
                    "alias": "fieldCategoryMappingsAggregate",
                    "args": null,
                    "concreteType": "field_category_mapping_aggregate",
                    "kind": "LinkedField",
                    "name": "field_category_mappings_aggregate",
                    "plural": false,
                    "selections": [
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "field_category_mapping_aggregate_fields",
                        "kind": "LinkedField",
                        "name": "aggregate",
                        "plural": false,
                        "selections": (v6/*: any*/),
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
                  },
                  {
                    "alias": "childrenCategoryAggregate",
                    "args": null,
                    "concreteType": "category_aggregate",
                    "kind": "LinkedField",
                    "name": "children_aggregate",
                    "plural": false,
                    "selections": [
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "category_aggregate_fields",
                        "kind": "LinkedField",
                        "name": "aggregate",
                        "plural": false,
                        "selections": (v6/*: any*/),
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
                  }
                ],
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
                    "concreteType": "field",
                    "kind": "LinkedField",
                    "name": "field",
                    "plural": false,
                    "selections": [
                      (v2/*: any*/),
                      (v4/*: any*/),
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "description",
                        "storageKey": null
                      },
                      {
                        "alias": "copiedFromFieldId",
                        "args": null,
                        "kind": "ScalarField",
                        "name": "copied_from_field_id",
                        "storageKey": null
                      },
                      {
                        "alias": "fieldPipelineDatasourceMappings",
                        "args": null,
                        "concreteType": "field_pipeline_datasource_mapping",
                        "kind": "LinkedField",
                        "name": "field_pipeline_datasource_mappings",
                        "plural": true,
                        "selections": [
                          {
                            "alias": "pipelineDatasource",
                            "args": null,
                            "concreteType": "pipeline_datasource",
                            "kind": "LinkedField",
                            "name": "pipeline_datasource",
                            "plural": false,
                            "selections": [
                              (v2/*: any*/),
                              (v4/*: any*/)
                            ],
                            "storageKey": null
                          },
                          (v2/*: any*/)
                        ],
                        "storageKey": null
                      },
                      {
                        "alias": "serializedCalculation",
                        "args": null,
                        "kind": "ScalarField",
                        "name": "calculation",
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
                  },
                  (v2/*: any*/),
                  (v5/*: any*/)
                ],
                "storageKey": null
              }
            ],
            "type": "category",
            "abstractKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "99449471a67a31c9e7b5a3735f6f8817",
    "id": null,
    "metadata": {},
    "name": "DirectoryTableContainerQuery",
    "operationKind": "query",
    "text": "query DirectoryTableContainerQuery(\n  $id: ID!\n) {\n  node(id: $id) {\n    __typename\n    ... on category {\n      children {\n        id\n      }\n      fieldCategoryMappings: field_category_mappings {\n        field {\n          id\n        }\n        id\n      }\n      ...DirectoryTable_category\n    }\n    id\n  }\n}\n\nfragment CategoryGroupRow_category on category {\n  id\n  name\n  visibilityStatus: visibility_status\n  ...useCategoryContentCount_category\n}\n\nfragment DirectoryTable_category on category {\n  children {\n    id\n    name\n    ...CategoryGroupRow_category\n  }\n  fieldCategoryMappings: field_category_mappings {\n    field {\n      id\n      name\n      ...FieldRow_field\n    }\n    ...FieldRow_fieldCategoryMapping\n    id\n  }\n}\n\nfragment FieldRow_field on field {\n  id\n  description\n  name\n  copiedFromFieldId: copied_from_field_id\n  fieldPipelineDatasourceMappings: field_pipeline_datasource_mappings {\n    pipelineDatasource: pipeline_datasource {\n      id\n      name\n    }\n    id\n  }\n  ...useFieldCalculation_field\n}\n\nfragment FieldRow_fieldCategoryMapping on field_category_mapping {\n  visibilityStatus: visibility_status\n}\n\nfragment useCategoryContentCount_category on category {\n  fieldCategoryMappingsAggregate: field_category_mappings_aggregate {\n    aggregate {\n      count\n    }\n  }\n  childrenCategoryAggregate: children_aggregate {\n    aggregate {\n      count\n    }\n  }\n}\n\nfragment useFieldCalculation_field on field {\n  serializedCalculation: calculation\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = '2817089cc20249f6e8a33ae9423c31e1';

export default node;
