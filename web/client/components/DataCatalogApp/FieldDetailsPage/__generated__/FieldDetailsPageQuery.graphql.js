/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
type FieldCalculationSection_categoryConnection$ref = any;
type FieldCalculationSection_field$ref = any;
type FieldCalculationSection_fieldConnection$ref = any;
type FieldDetailsSection_categoryConnection$ref = any;
type FieldDetailsSection_dimensionConnection$ref = any;
type FieldDetailsSection_field$ref = any;
type FieldDetailsSection_fieldConnection$ref = any;
type FieldDimensionSection_field$ref = any;
type FieldProfilingSection_field$ref = any;
type FieldTitleSection_field$ref = any;
export type FieldDetailsPageQueryVariables = {|
  id: string
|};
export type FieldDetailsPageQueryResponse = {|
  +node: ?{|
    +$fragmentRefs: FieldDetailsSection_field$ref & FieldDimensionSection_field$ref & FieldCalculationSection_field$ref & FieldProfilingSection_field$ref & FieldTitleSection_field$ref
  |},
  +categoryConnection: {|
    +$fragmentRefs: FieldDetailsSection_categoryConnection$ref & FieldCalculationSection_categoryConnection$ref
  |},
  +dimensionConnection: {|
    +$fragmentRefs: FieldDetailsSection_dimensionConnection$ref
  |},
  +fieldConnection: {|
    +$fragmentRefs: FieldDetailsSection_fieldConnection$ref & FieldCalculationSection_fieldConnection$ref
  |},
|};
export type FieldDetailsPageQuery = {|
  variables: FieldDetailsPageQueryVariables,
  response: FieldDetailsPageQueryResponse,
|};
*/


/*
query FieldDetailsPageQuery(
  $id: ID!
) {
  node(id: $id) {
    __typename
    ... on field {
      ...FieldDetailsSection_field
      ...FieldDimensionSection_field
      ...FieldCalculationSection_field
      ...FieldProfilingSection_field
      ...FieldTitleSection_field
    }
    id
  }
  categoryConnection: category_connection {
    ...FieldDetailsSection_categoryConnection
    ...FieldCalculationSection_categoryConnection
  }
  dimensionConnection: dimension_connection {
    ...FieldDetailsSection_dimensionConnection
  }
  fieldConnection: field_connection {
    ...FieldDetailsSection_fieldConnection
    ...FieldCalculationSection_fieldConnection
  }
}

fragment CalculationRow_dimensionConnection on dimensionConnection {
  ...EditableCalculation_dimensionConnection
}

fragment CalculationRow_field on field {
  id
  ...useFieldCalculation_field
}

fragment CategoryRow_categoryConnection on categoryConnection {
  ...useFilterHierarchy_categoryConnection
}

fragment CategoryRow_field on field {
  id
  ...EditableCategoryValue_field
}

fragment CategoryRow_fieldConnection on fieldConnection {
  ...useFilterHierarchy_fieldConnection
}

fragment DatasourceRow_field on field {
  fieldPipelineDatasourceMappings: field_pipeline_datasource_mappings {
    pipelineDatasource: pipeline_datasource {
      id
      name
    }
    id
  }
}

fragment DescriptionRow_field on field {
  description
  id
}

fragment EditableCalculation_dimensionConnection on dimensionConnection {
  ...useDimensionList_dimensionConnection
}

fragment EditableCategoryValue_field on field {
  fieldCategoryMappings: field_category_mappings {
    category {
      id
      name
    }
    id
  }
}

fragment FieldCalculationSection_categoryConnection on categoryConnection {
  ...IndicatorFormulaModalWrapper_categoryConnection
}

fragment FieldCalculationSection_field on field {
  fieldId: id
  fieldName: name
  ...useFieldCalculation_field
}

fragment FieldCalculationSection_fieldConnection on fieldConnection {
  ...IndicatorFormulaModalWrapper_fieldConnection
}

fragment FieldDetailsSection_categoryConnection on categoryConnection {
  ...CategoryRow_categoryConnection
}

fragment FieldDetailsSection_dimensionConnection on dimensionConnection {
  ...CalculationRow_dimensionConnection
}

fragment FieldDetailsSection_field on field {
  ...CalculationRow_field
  ...CategoryRow_field
  ...DatasourceRow_field
  ...DescriptionRow_field
  ...NameRow_field
  ...VisibilityRow_field
  ...ShortNameRow_field
  ...FieldIdRow_field
}

fragment FieldDetailsSection_fieldConnection on fieldConnection {
  ...CategoryRow_fieldConnection
}

fragment FieldDimensionSection_field on field {
  fieldDimensionMappings: field_dimension_mappings {
    dimension {
      id
      name
      description
    }
    id
  }
}

fragment FieldIdRow_field on field {
  id
  ...useFieldCalculation_field
}

fragment FieldProfilingSection_field on field {
  name
  shortName: short_name
  serializedCalculation: calculation
  ...useFieldCalculation_field
}

fragment FieldTitleSection_field on field {
  id
  name
  copiedFromFieldId: copied_from_field_id
  ...useFieldCalculation_field
}

fragment IndicatorFormulaModalWrapper_categoryConnection on categoryConnection {
  ...useFilterHierarchy_categoryConnection
}

fragment IndicatorFormulaModalWrapper_fieldConnection on fieldConnection {
  ...useFilterHierarchy_fieldConnection
  ...IndicatorFormulaModal_fieldConnection
}

fragment IndicatorFormulaModal_fieldConnection on fieldConnection {
  edges {
    node {
      id
      name
      serializedCalculation: calculation
    }
  }
}

fragment NameRow_field on field {
  id
  name
}

fragment ShortNameRow_field on field {
  id
  shortName: short_name
}

fragment VisibilityRow_field on field {
  fieldCategoryMappings: field_category_mappings {
    categoryId: category_id
    fieldId: field_id
    visibilityStatus: visibility_status
    id
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

fragment useFieldCalculation_field on field {
  serializedCalculation: calculation
}

fragment useFilterHierarchy_categoryConnection on categoryConnection {
  edges {
    node {
      id
      name
      parent {
        id
      }
    }
  }
}

fragment useFilterHierarchy_fieldConnection on fieldConnection {
  edges {
    node {
      id
      name
      shortName: short_name
      fieldCategoryMappings: field_category_mappings {
        category {
          id
        }
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
v3 = {
  "alias": "serializedCalculation",
  "args": null,
  "kind": "ScalarField",
  "name": "calculation",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v5 = [
  (v2/*: any*/),
  (v4/*: any*/)
],
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "description",
  "storageKey": null
},
v7 = {
  "alias": "shortName",
  "args": null,
  "kind": "ScalarField",
  "name": "short_name",
  "storageKey": null
},
v8 = [
  (v2/*: any*/)
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "FieldDetailsPageQuery",
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
                "args": null,
                "kind": "FragmentSpread",
                "name": "FieldDetailsSection_field"
              },
              {
                "args": null,
                "kind": "FragmentSpread",
                "name": "FieldDimensionSection_field"
              },
              {
                "args": null,
                "kind": "FragmentSpread",
                "name": "FieldCalculationSection_field"
              },
              {
                "args": null,
                "kind": "FragmentSpread",
                "name": "FieldProfilingSection_field"
              },
              {
                "args": null,
                "kind": "FragmentSpread",
                "name": "FieldTitleSection_field"
              }
            ],
            "type": "field",
            "abstractKey": null
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
            "name": "FieldDetailsSection_categoryConnection"
          },
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "FieldCalculationSection_categoryConnection"
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
            "name": "FieldDetailsSection_dimensionConnection"
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
            "name": "FieldDetailsSection_fieldConnection"
          },
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "FieldCalculationSection_fieldConnection"
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
    "name": "FieldDetailsPageQuery",
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
              (v3/*: any*/),
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
                  (v2/*: any*/),
                  {
                    "alias": "categoryId",
                    "args": null,
                    "kind": "ScalarField",
                    "name": "category_id",
                    "storageKey": null
                  },
                  {
                    "alias": "fieldId",
                    "args": null,
                    "kind": "ScalarField",
                    "name": "field_id",
                    "storageKey": null
                  },
                  {
                    "alias": "visibilityStatus",
                    "args": null,
                    "kind": "ScalarField",
                    "name": "visibility_status",
                    "storageKey": null
                  }
                ],
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
                    "selections": (v5/*: any*/),
                    "storageKey": null
                  },
                  (v2/*: any*/)
                ],
                "storageKey": null
              },
              (v6/*: any*/),
              (v4/*: any*/),
              (v7/*: any*/),
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
                    "selections": [
                      (v2/*: any*/),
                      (v4/*: any*/),
                      (v6/*: any*/)
                    ],
                    "storageKey": null
                  },
                  (v2/*: any*/)
                ],
                "storageKey": null
              },
              {
                "alias": "fieldId",
                "args": null,
                "kind": "ScalarField",
                "name": "id",
                "storageKey": null
              },
              {
                "alias": "fieldName",
                "args": null,
                "kind": "ScalarField",
                "name": "name",
                "storageKey": null
              },
              {
                "alias": "copiedFromFieldId",
                "args": null,
                "kind": "ScalarField",
                "name": "copied_from_field_id",
                "storageKey": null
              }
            ],
            "type": "field",
            "abstractKey": null
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
                  (v2/*: any*/),
                  (v4/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "category",
                    "kind": "LinkedField",
                    "name": "parent",
                    "plural": false,
                    "selections": (v8/*: any*/),
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
                  (v2/*: any*/),
                  (v4/*: any*/),
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
                          (v4/*: any*/),
                          (v2/*: any*/)
                        ],
                        "storageKey": null
                      },
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
                  (v2/*: any*/),
                  (v4/*: any*/),
                  (v7/*: any*/),
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
                        "selections": (v8/*: any*/),
                        "storageKey": null
                      },
                      (v2/*: any*/)
                    ],
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
    ]
  },
  "params": {
    "cacheID": "0a1e1f5120a62283a32f5ea8c99920ef",
    "id": null,
    "metadata": {},
    "name": "FieldDetailsPageQuery",
    "operationKind": "query",
    "text": "query FieldDetailsPageQuery(\n  $id: ID!\n) {\n  node(id: $id) {\n    __typename\n    ... on field {\n      ...FieldDetailsSection_field\n      ...FieldDimensionSection_field\n      ...FieldCalculationSection_field\n      ...FieldProfilingSection_field\n      ...FieldTitleSection_field\n    }\n    id\n  }\n  categoryConnection: category_connection {\n    ...FieldDetailsSection_categoryConnection\n    ...FieldCalculationSection_categoryConnection\n  }\n  dimensionConnection: dimension_connection {\n    ...FieldDetailsSection_dimensionConnection\n  }\n  fieldConnection: field_connection {\n    ...FieldDetailsSection_fieldConnection\n    ...FieldCalculationSection_fieldConnection\n  }\n}\n\nfragment CalculationRow_dimensionConnection on dimensionConnection {\n  ...EditableCalculation_dimensionConnection\n}\n\nfragment CalculationRow_field on field {\n  id\n  ...useFieldCalculation_field\n}\n\nfragment CategoryRow_categoryConnection on categoryConnection {\n  ...useFilterHierarchy_categoryConnection\n}\n\nfragment CategoryRow_field on field {\n  id\n  ...EditableCategoryValue_field\n}\n\nfragment CategoryRow_fieldConnection on fieldConnection {\n  ...useFilterHierarchy_fieldConnection\n}\n\nfragment DatasourceRow_field on field {\n  fieldPipelineDatasourceMappings: field_pipeline_datasource_mappings {\n    pipelineDatasource: pipeline_datasource {\n      id\n      name\n    }\n    id\n  }\n}\n\nfragment DescriptionRow_field on field {\n  description\n  id\n}\n\nfragment EditableCalculation_dimensionConnection on dimensionConnection {\n  ...useDimensionList_dimensionConnection\n}\n\nfragment EditableCategoryValue_field on field {\n  fieldCategoryMappings: field_category_mappings {\n    category {\n      id\n      name\n    }\n    id\n  }\n}\n\nfragment FieldCalculationSection_categoryConnection on categoryConnection {\n  ...IndicatorFormulaModalWrapper_categoryConnection\n}\n\nfragment FieldCalculationSection_field on field {\n  fieldId: id\n  fieldName: name\n  ...useFieldCalculation_field\n}\n\nfragment FieldCalculationSection_fieldConnection on fieldConnection {\n  ...IndicatorFormulaModalWrapper_fieldConnection\n}\n\nfragment FieldDetailsSection_categoryConnection on categoryConnection {\n  ...CategoryRow_categoryConnection\n}\n\nfragment FieldDetailsSection_dimensionConnection on dimensionConnection {\n  ...CalculationRow_dimensionConnection\n}\n\nfragment FieldDetailsSection_field on field {\n  ...CalculationRow_field\n  ...CategoryRow_field\n  ...DatasourceRow_field\n  ...DescriptionRow_field\n  ...NameRow_field\n  ...VisibilityRow_field\n  ...ShortNameRow_field\n  ...FieldIdRow_field\n}\n\nfragment FieldDetailsSection_fieldConnection on fieldConnection {\n  ...CategoryRow_fieldConnection\n}\n\nfragment FieldDimensionSection_field on field {\n  fieldDimensionMappings: field_dimension_mappings {\n    dimension {\n      id\n      name\n      description\n    }\n    id\n  }\n}\n\nfragment FieldIdRow_field on field {\n  id\n  ...useFieldCalculation_field\n}\n\nfragment FieldProfilingSection_field on field {\n  name\n  shortName: short_name\n  serializedCalculation: calculation\n  ...useFieldCalculation_field\n}\n\nfragment FieldTitleSection_field on field {\n  id\n  name\n  copiedFromFieldId: copied_from_field_id\n  ...useFieldCalculation_field\n}\n\nfragment IndicatorFormulaModalWrapper_categoryConnection on categoryConnection {\n  ...useFilterHierarchy_categoryConnection\n}\n\nfragment IndicatorFormulaModalWrapper_fieldConnection on fieldConnection {\n  ...useFilterHierarchy_fieldConnection\n  ...IndicatorFormulaModal_fieldConnection\n}\n\nfragment IndicatorFormulaModal_fieldConnection on fieldConnection {\n  edges {\n    node {\n      id\n      name\n      serializedCalculation: calculation\n    }\n  }\n}\n\nfragment NameRow_field on field {\n  id\n  name\n}\n\nfragment ShortNameRow_field on field {\n  id\n  shortName: short_name\n}\n\nfragment VisibilityRow_field on field {\n  fieldCategoryMappings: field_category_mappings {\n    categoryId: category_id\n    fieldId: field_id\n    visibilityStatus: visibility_status\n    id\n  }\n}\n\nfragment useDimensionList_dimensionConnection on dimensionConnection {\n  edges {\n    node {\n      id\n      name\n      dimensionCategoryMappings: dimension_category_mappings {\n        category: dimension_category {\n          name\n          id\n        }\n        id\n      }\n    }\n  }\n}\n\nfragment useFieldCalculation_field on field {\n  serializedCalculation: calculation\n}\n\nfragment useFilterHierarchy_categoryConnection on categoryConnection {\n  edges {\n    node {\n      id\n      name\n      parent {\n        id\n      }\n    }\n  }\n}\n\nfragment useFilterHierarchy_fieldConnection on fieldConnection {\n  edges {\n    node {\n      id\n      name\n      shortName: short_name\n      fieldCategoryMappings: field_category_mappings {\n        category {\n          id\n        }\n        id\n      }\n    }\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = '3d3c22d2ead4f860ad00616760885228';

export default node;
