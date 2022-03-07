/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
type useDimensionList_dimensionConnection$ref = any;
type useFieldHierarchy_categoryConnection$ref = any;
type useFieldHierarchy_fieldConnection$ref = any;
type useGroupingHierarchy_dimensionConnection$ref = any;
export type QueryBuilderQueryVariables = {||};
export type QueryBuilderQueryResponse = {|
  +dimensionConnection: {|
    +$fragmentRefs: useGroupingHierarchy_dimensionConnection$ref & useDimensionList_dimensionConnection$ref
  |},
  +fieldConnection: {|
    +$fragmentRefs: useFieldHierarchy_fieldConnection$ref
  |},
  +categoryConnection: {|
    +$fragmentRefs: useFieldHierarchy_categoryConnection$ref
  |},
|};
export type QueryBuilderQuery = {|
  variables: QueryBuilderQueryVariables,
  response: QueryBuilderQueryResponse,
|};
*/


/*
query QueryBuilderQuery {
  dimensionConnection: dimension_connection {
    ...useGroupingHierarchy_dimensionConnection
    ...useDimensionList_dimensionConnection
  }
  fieldConnection: field_connection {
    ...useFieldHierarchy_fieldConnection
  }
  categoryConnection: category_connection {
    ...useFieldHierarchy_categoryConnection
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

fragment useGroupingHierarchy_dimensionConnection on dimensionConnection {
  edges {
    node {
      id
      name
      dimensionCategoryMappings: dimension_category_mappings {
        category: dimension_category {
          id
          name
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
],
v3 = {
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
    "name": "QueryBuilderQuery",
    "selections": [
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
            "name": "useGroupingHierarchy_dimensionConnection"
          },
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "useDimensionList_dimensionConnection"
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
      }
    ],
    "type": "query_root",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "QueryBuilderQuery",
    "selections": [
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
                      (v3/*: any*/),
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
    "cacheID": "f599704c98781d2d939d9184d00af94e",
    "id": null,
    "metadata": {},
    "name": "QueryBuilderQuery",
    "operationKind": "query",
    "text": "query QueryBuilderQuery {\n  dimensionConnection: dimension_connection {\n    ...useGroupingHierarchy_dimensionConnection\n    ...useDimensionList_dimensionConnection\n  }\n  fieldConnection: field_connection {\n    ...useFieldHierarchy_fieldConnection\n  }\n  categoryConnection: category_connection {\n    ...useFieldHierarchy_categoryConnection\n  }\n}\n\nfragment useDimensionList_dimensionConnection on dimensionConnection {\n  edges {\n    node {\n      id\n      name\n      dimensionCategoryMappings: dimension_category_mappings {\n        category: dimension_category {\n          name\n          id\n        }\n        id\n      }\n    }\n  }\n}\n\nfragment useFieldHierarchy_categoryConnection on categoryConnection {\n  edges {\n    node {\n      id\n      name\n      parent {\n        id\n      }\n      visibilityStatus: visibility_status\n    }\n  }\n}\n\nfragment useFieldHierarchy_fieldConnection on fieldConnection {\n  edges {\n    node {\n      id\n      name\n      serializedCalculation: calculation\n      shortName: short_name\n      fieldCategoryMappings: field_category_mappings {\n        category {\n          id\n        }\n        visibilityStatus: visibility_status\n        id\n      }\n      fieldDimensionMappings: field_dimension_mappings {\n        dimension {\n          id\n        }\n        id\n      }\n    }\n  }\n}\n\nfragment useGroupingHierarchy_dimensionConnection on dimensionConnection {\n  edges {\n    node {\n      id\n      name\n      dimensionCategoryMappings: dimension_category_mappings {\n        category: dimension_category {\n          id\n          name\n        }\n        id\n      }\n    }\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = '17ded2400df6b842e98ed9a4faca52ac';

export default node;
