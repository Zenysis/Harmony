/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
type useFieldHierarchy_categoryConnection$ref = any;
type useFieldHierarchy_fieldConnection$ref = any;
export type useFieldHierarchyRootQueryVariables = {||};
export type useFieldHierarchyRootQueryResponse = {|
  +fieldConnection: {|
    +$fragmentRefs: useFieldHierarchy_fieldConnection$ref
  |},
  +categoryConnection: {|
    +$fragmentRefs: useFieldHierarchy_categoryConnection$ref
  |},
|};
export type useFieldHierarchyRootQuery = {|
  variables: useFieldHierarchyRootQueryVariables,
  response: useFieldHierarchyRootQueryResponse,
|};
*/


/*
query useFieldHierarchyRootQuery {
  fieldConnection: field_connection {
    ...useFieldHierarchy_fieldConnection
  }
  categoryConnection: category_connection {
    ...useFieldHierarchy_categoryConnection
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
    "name": "useFieldHierarchyRootQuery",
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
    "name": "useFieldHierarchyRootQuery",
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
    "cacheID": "356c69fd9a75897956e6b769151568d5",
    "id": null,
    "metadata": {},
    "name": "useFieldHierarchyRootQuery",
    "operationKind": "query",
    "text": "query useFieldHierarchyRootQuery {\n  fieldConnection: field_connection {\n    ...useFieldHierarchy_fieldConnection\n  }\n  categoryConnection: category_connection {\n    ...useFieldHierarchy_categoryConnection\n  }\n}\n\nfragment useFieldHierarchy_categoryConnection on categoryConnection {\n  edges {\n    node {\n      id\n      name\n      parent {\n        id\n      }\n      visibilityStatus: visibility_status\n    }\n  }\n}\n\nfragment useFieldHierarchy_fieldConnection on fieldConnection {\n  edges {\n    node {\n      id\n      name\n      serializedCalculation: calculation\n      shortName: short_name\n      fieldCategoryMappings: field_category_mappings {\n        category {\n          id\n        }\n        visibilityStatus: visibility_status\n        id\n      }\n      fieldDimensionMappings: field_dimension_mappings {\n        dimension {\n          id\n        }\n        id\n      }\n    }\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = '1781a783562414672b5f3152c6d54dcc';

export default node;
