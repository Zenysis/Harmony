/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
type CopyIndicatorView_dimensionConnection$ref = any;
type CopyIndicatorView_field$ref = any;
export type CopyIndicatorViewWrapperQueryVariables = {|
  id: string
|};
export type CopyIndicatorViewWrapperQueryResponse = {|
  +node: ?{|
    +$fragmentRefs: CopyIndicatorView_field$ref
  |},
  +dimensionConnection: {|
    +$fragmentRefs: CopyIndicatorView_dimensionConnection$ref
  |},
|};
export type CopyIndicatorViewWrapperQuery = {|
  variables: CopyIndicatorViewWrapperQueryVariables,
  response: CopyIndicatorViewWrapperQueryResponse,
|};
*/


/*
query CopyIndicatorViewWrapperQuery(
  $id: ID!
) {
  node(id: $id) {
    __typename
    ... on field {
      ...CopyIndicatorView_field
    }
    id
  }
  dimensionConnection: dimension_connection {
    ...CopyIndicatorView_dimensionConnection
  }
}

fragment CopyIndicatorView_dimensionConnection on dimensionConnection {
  ...useDimensionList_dimensionConnection
}

fragment CopyIndicatorView_field on field {
  name
  ...useFieldCalculation_field
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
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "CopyIndicatorViewWrapperQuery",
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
                "name": "CopyIndicatorView_field"
              }
            ],
            "type": "field",
            "abstractKey": null
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
            "name": "CopyIndicatorView_dimensionConnection"
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
    "name": "CopyIndicatorViewWrapperQuery",
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
                "alias": "serializedCalculation",
                "args": null,
                "kind": "ScalarField",
                "name": "calculation",
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
                  (v3/*: any*/),
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
                          (v3/*: any*/),
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
      }
    ]
  },
  "params": {
    "cacheID": "38726d6771c5e7b35cc7790343e16e9a",
    "id": null,
    "metadata": {},
    "name": "CopyIndicatorViewWrapperQuery",
    "operationKind": "query",
    "text": "query CopyIndicatorViewWrapperQuery(\n  $id: ID!\n) {\n  node(id: $id) {\n    __typename\n    ... on field {\n      ...CopyIndicatorView_field\n    }\n    id\n  }\n  dimensionConnection: dimension_connection {\n    ...CopyIndicatorView_dimensionConnection\n  }\n}\n\nfragment CopyIndicatorView_dimensionConnection on dimensionConnection {\n  ...useDimensionList_dimensionConnection\n}\n\nfragment CopyIndicatorView_field on field {\n  name\n  ...useFieldCalculation_field\n}\n\nfragment useDimensionList_dimensionConnection on dimensionConnection {\n  edges {\n    node {\n      id\n      name\n      dimensionCategoryMappings: dimension_category_mappings {\n        category: dimension_category {\n          name\n          id\n        }\n        id\n      }\n    }\n  }\n}\n\nfragment useFieldCalculation_field on field {\n  serializedCalculation: calculation\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = '1baba302e79b051c91b49edfbe4151a6';

export default node;
