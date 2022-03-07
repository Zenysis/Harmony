/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
type CreateCalculationIndicatorView_categoryConnection$ref = any;
type CreateCalculationIndicatorView_dimensionConnection$ref = any;
type CreateCalculationIndicatorView_fieldConnection$ref = any;
type FieldTable_fieldConnection$ref = any;
type useFilterHierarchy_categoryConnection$ref = any;
type useFilterHierarchy_fieldConnection$ref = any;
export type FieldOverviewPageQueryVariables = {||};
export type FieldOverviewPageQueryResponse = {|
  +fieldConnection: {|
    +$fragmentRefs: CreateCalculationIndicatorView_fieldConnection$ref & FieldTable_fieldConnection$ref & useFilterHierarchy_fieldConnection$ref
  |},
  +categoryConnection: {|
    +$fragmentRefs: CreateCalculationIndicatorView_categoryConnection$ref & useFilterHierarchy_categoryConnection$ref
  |},
  +dimensionConnection: {|
    +$fragmentRefs: CreateCalculationIndicatorView_dimensionConnection$ref
  |},
|};
export type FieldOverviewPageQuery = {|
  variables: FieldOverviewPageQueryVariables,
  response: FieldOverviewPageQueryResponse,
|};
*/


/*
query FieldOverviewPageQuery {
  fieldConnection: field_connection {
    ...CreateCalculationIndicatorView_fieldConnection
    ...FieldTable_fieldConnection
    ...useFilterHierarchy_fieldConnection
  }
  categoryConnection: category_connection {
    ...CreateCalculationIndicatorView_categoryConnection
    ...useFilterHierarchy_categoryConnection
  }
  dimensionConnection: dimension_connection {
    ...CreateCalculationIndicatorView_dimensionConnection
  }
}

fragment CreateCalculationIndicatorView_categoryConnection on categoryConnection {
  ...EditCalculationView_categoryConnection
}

fragment CreateCalculationIndicatorView_dimensionConnection on dimensionConnection {
  ...useDimensionList_dimensionConnection
}

fragment CreateCalculationIndicatorView_fieldConnection on fieldConnection {
  ...EditCalculationView_fieldConnection
}

fragment EditCalculationView_categoryConnection on categoryConnection {
  ...useFieldHierarchy_categoryConnection
}

fragment EditCalculationView_fieldConnection on fieldConnection {
  ...IndicatorFormulaModal_fieldConnection
  ...useFieldHierarchy_fieldConnection
}

fragment FieldTable_fieldConnection on fieldConnection {
  edges {
    node {
      id
      name
      description
      serializedCalculation: calculation
      fieldPipelineDatasourceMappings: field_pipeline_datasource_mappings {
        pipelineDatasource: pipeline_datasource {
          id
          name
        }
        id
      }
      fieldCategoryMappings: field_category_mappings {
        category {
          id
        }
        id
      }
    }
  }
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
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v2 = [
  (v0/*: any*/)
];
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "FieldOverviewPageQuery",
    "selections": [
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
            "name": "CreateCalculationIndicatorView_fieldConnection"
          },
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "FieldTable_fieldConnection"
          },
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "useFilterHierarchy_fieldConnection"
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
            "name": "CreateCalculationIndicatorView_categoryConnection"
          },
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "useFilterHierarchy_categoryConnection"
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
            "name": "CreateCalculationIndicatorView_dimensionConnection"
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
    "name": "FieldOverviewPageQuery",
    "selections": [
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
                  (v0/*: any*/),
                  (v1/*: any*/),
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
                        "selections": (v2/*: any*/),
                        "storageKey": null
                      },
                      (v0/*: any*/)
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
                        "selections": (v2/*: any*/),
                        "storageKey": null
                      },
                      (v0/*: any*/)
                    ],
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
                          (v0/*: any*/),
                          (v1/*: any*/)
                        ],
                        "storageKey": null
                      },
                      (v0/*: any*/)
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
                  (v0/*: any*/),
                  (v1/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "category",
                    "kind": "LinkedField",
                    "name": "parent",
                    "plural": false,
                    "selections": (v2/*: any*/),
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
                  (v0/*: any*/),
                  (v1/*: any*/),
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
                          (v1/*: any*/),
                          (v0/*: any*/)
                        ],
                        "storageKey": null
                      },
                      (v0/*: any*/)
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
      }
    ]
  },
  "params": {
    "cacheID": "0368aff87e2398bc2c730bbabf06ecd7",
    "id": null,
    "metadata": {},
    "name": "FieldOverviewPageQuery",
    "operationKind": "query",
    "text": "query FieldOverviewPageQuery {\n  fieldConnection: field_connection {\n    ...CreateCalculationIndicatorView_fieldConnection\n    ...FieldTable_fieldConnection\n    ...useFilterHierarchy_fieldConnection\n  }\n  categoryConnection: category_connection {\n    ...CreateCalculationIndicatorView_categoryConnection\n    ...useFilterHierarchy_categoryConnection\n  }\n  dimensionConnection: dimension_connection {\n    ...CreateCalculationIndicatorView_dimensionConnection\n  }\n}\n\nfragment CreateCalculationIndicatorView_categoryConnection on categoryConnection {\n  ...EditCalculationView_categoryConnection\n}\n\nfragment CreateCalculationIndicatorView_dimensionConnection on dimensionConnection {\n  ...useDimensionList_dimensionConnection\n}\n\nfragment CreateCalculationIndicatorView_fieldConnection on fieldConnection {\n  ...EditCalculationView_fieldConnection\n}\n\nfragment EditCalculationView_categoryConnection on categoryConnection {\n  ...useFieldHierarchy_categoryConnection\n}\n\nfragment EditCalculationView_fieldConnection on fieldConnection {\n  ...IndicatorFormulaModal_fieldConnection\n  ...useFieldHierarchy_fieldConnection\n}\n\nfragment FieldTable_fieldConnection on fieldConnection {\n  edges {\n    node {\n      id\n      name\n      description\n      serializedCalculation: calculation\n      fieldPipelineDatasourceMappings: field_pipeline_datasource_mappings {\n        pipelineDatasource: pipeline_datasource {\n          id\n          name\n        }\n        id\n      }\n      fieldCategoryMappings: field_category_mappings {\n        category {\n          id\n        }\n        id\n      }\n    }\n  }\n}\n\nfragment IndicatorFormulaModal_fieldConnection on fieldConnection {\n  edges {\n    node {\n      id\n      name\n      serializedCalculation: calculation\n    }\n  }\n}\n\nfragment useDimensionList_dimensionConnection on dimensionConnection {\n  edges {\n    node {\n      id\n      name\n      dimensionCategoryMappings: dimension_category_mappings {\n        category: dimension_category {\n          name\n          id\n        }\n        id\n      }\n    }\n  }\n}\n\nfragment useFieldHierarchy_categoryConnection on categoryConnection {\n  edges {\n    node {\n      id\n      name\n      parent {\n        id\n      }\n    }\n  }\n}\n\nfragment useFieldHierarchy_fieldConnection on fieldConnection {\n  edges {\n    node {\n      id\n      name\n      serializedCalculation: calculation\n      shortName: short_name\n      fieldCategoryMappings: field_category_mappings {\n        category {\n          id\n        }\n        id\n      }\n      fieldDimensionMappings: field_dimension_mappings {\n        dimension {\n          id\n        }\n        id\n      }\n    }\n  }\n}\n\nfragment useFilterHierarchy_categoryConnection on categoryConnection {\n  edges {\n    node {\n      id\n      name\n      parent {\n        id\n      }\n    }\n  }\n}\n\nfragment useFilterHierarchy_fieldConnection on fieldConnection {\n  edges {\n    node {\n      id\n      name\n      shortName: short_name\n      fieldCategoryMappings: field_category_mappings {\n        category {\n          id\n        }\n        id\n      }\n    }\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = 'e4bf7cb8e2acf405e42b4ba98a0cace6';

export default node;
