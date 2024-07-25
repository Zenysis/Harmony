/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
type useFilterHierarchy_categoryConnection$ref = any;
type useFilterHierarchy_fieldConnection$ref = any;
export type UnpublishedFieldsTableContainerQueryVariables = {||};
export type UnpublishedFieldsTableContainerQueryResponse = {|
  +categoryConnection: {|
    +$fragmentRefs: useFilterHierarchy_categoryConnection$ref
  |},
  +fieldConnection: {|
    +$fragmentRefs: useFilterHierarchy_fieldConnection$ref
  |},
  +unpublishedFieldConnection: {|
    +edges: $ReadOnlyArray<{|
      +node: {|
        +id: string
      |}
    |}>
  |},
|};
export type UnpublishedFieldsTableContainerQuery = {|
  variables: UnpublishedFieldsTableContainerQueryVariables,
  response: UnpublishedFieldsTableContainerQueryResponse,
|};
*/


/*
query UnpublishedFieldsTableContainerQuery {
  categoryConnection: category_connection {
    ...useFilterHierarchy_categoryConnection
  }
  fieldConnection: field_connection {
    ...useFilterHierarchy_fieldConnection
  }
  unpublishedFieldConnection: unpublished_field_connection {
    edges {
      node {
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
v1 = [
  (v0/*: any*/)
],
v2 = {
  "alias": "unpublishedFieldConnection",
  "args": null,
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
          "selections": (v1/*: any*/),
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
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
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "UnpublishedFieldsTableContainerQuery",
    "selections": [
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
            "name": "useFilterHierarchy_categoryConnection"
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
            "name": "useFilterHierarchy_fieldConnection"
          }
        ],
        "storageKey": null
      },
      (v2/*: any*/)
    ],
    "type": "query_root",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "UnpublishedFieldsTableContainerQuery",
    "selections": [
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
                  (v3/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "category",
                    "kind": "LinkedField",
                    "name": "parent",
                    "plural": false,
                    "selections": (v1/*: any*/),
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
                  (v3/*: any*/),
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
                        "selections": (v1/*: any*/),
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
      (v2/*: any*/)
    ]
  },
  "params": {
    "cacheID": "bf34c7934a28c4a6aecba428e5fb7ab4",
    "id": null,
    "metadata": {},
    "name": "UnpublishedFieldsTableContainerQuery",
    "operationKind": "query",
    "text": "query UnpublishedFieldsTableContainerQuery {\n  categoryConnection: category_connection {\n    ...useFilterHierarchy_categoryConnection\n  }\n  fieldConnection: field_connection {\n    ...useFilterHierarchy_fieldConnection\n  }\n  unpublishedFieldConnection: unpublished_field_connection {\n    edges {\n      node {\n        id\n      }\n    }\n  }\n}\n\nfragment useFilterHierarchy_categoryConnection on categoryConnection {\n  edges {\n    node {\n      id\n      name\n      parent {\n        id\n      }\n    }\n  }\n}\n\nfragment useFilterHierarchy_fieldConnection on fieldConnection {\n  edges {\n    node {\n      id\n      name\n      shortName: short_name\n      fieldCategoryMappings: field_category_mappings {\n        category {\n          id\n        }\n        id\n      }\n    }\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = '9b58540462eefe836dd06d7bf0a883a5';

export default node;
