/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
export type patchFieldMetadataServiceQueryVariables = {||};
export type patchFieldMetadataServiceQueryResponse = {|
  +fieldConnection: {|
    +edges: $ReadOnlyArray<{|
      +node: {|
        +id: string,
        +calculation: any,
        +description: ?string,
        +fieldDimensionMappings: $ReadOnlyArray<{|
          +dimension: {|
            +id: string,
            +name: string,
          |}
        |}>,
        +fieldCategoryMappings: $ReadOnlyArray<{|
          +category: {|
            +id: string,
            +name: string,
          |}
        |}>,
        +fieldPipelineDatasourceMappings: $ReadOnlyArray<{|
          +pipelineDatasource: {|
            +id: string,
            +name: string,
          |}
        |}>,
      |}
    |}>
  |},
  +categoryConnection: {|
    +edges: $ReadOnlyArray<{|
      +node: {|
        +id: string,
        +name: string,
        +parent: ?{|
          +id: string
        |},
      |}
    |}>
  |},
|};
export type patchFieldMetadataServiceQuery = {|
  variables: patchFieldMetadataServiceQueryVariables,
  response: patchFieldMetadataServiceQueryResponse,
|};
*/


/*
query patchFieldMetadataServiceQuery {
  fieldConnection: field_connection {
    edges {
      node {
        id
        calculation
        description
        fieldDimensionMappings: field_dimension_mappings {
          dimension {
            id
            name
          }
          id
        }
        fieldCategoryMappings: field_category_mappings {
          category {
            id
            name
          }
          id
        }
        fieldPipelineDatasourceMappings: field_pipeline_datasource_mappings {
          pipelineDatasource: pipeline_datasource {
            id
            name
          }
          id
        }
      }
    }
  }
  categoryConnection: category_connection {
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
  "name": "calculation",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "description",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v4 = [
  (v0/*: any*/),
  (v3/*: any*/)
],
v5 = {
  "alias": null,
  "args": null,
  "concreteType": "dimension",
  "kind": "LinkedField",
  "name": "dimension",
  "plural": false,
  "selections": (v4/*: any*/),
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "concreteType": "category",
  "kind": "LinkedField",
  "name": "category",
  "plural": false,
  "selections": (v4/*: any*/),
  "storageKey": null
},
v7 = {
  "alias": "pipelineDatasource",
  "args": null,
  "concreteType": "pipeline_datasource",
  "kind": "LinkedField",
  "name": "pipeline_datasource",
  "plural": false,
  "selections": (v4/*: any*/),
  "storageKey": null
},
v8 = {
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
              "selections": [
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
};
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "patchFieldMetadataServiceQuery",
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
                  (v2/*: any*/),
                  {
                    "alias": "fieldDimensionMappings",
                    "args": null,
                    "concreteType": "field_dimension_mapping",
                    "kind": "LinkedField",
                    "name": "field_dimension_mappings",
                    "plural": true,
                    "selections": [
                      (v5/*: any*/)
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
                      (v6/*: any*/)
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
                      (v7/*: any*/)
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
      (v8/*: any*/)
    ],
    "type": "query_root",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "patchFieldMetadataServiceQuery",
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
                  (v2/*: any*/),
                  {
                    "alias": "fieldDimensionMappings",
                    "args": null,
                    "concreteType": "field_dimension_mapping",
                    "kind": "LinkedField",
                    "name": "field_dimension_mappings",
                    "plural": true,
                    "selections": [
                      (v5/*: any*/),
                      (v0/*: any*/)
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
                      (v6/*: any*/),
                      (v0/*: any*/)
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
                      (v7/*: any*/),
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
      (v8/*: any*/)
    ]
  },
  "params": {
    "cacheID": "108b7e711b9d6d32805c7ec83e1e4b20",
    "id": null,
    "metadata": {},
    "name": "patchFieldMetadataServiceQuery",
    "operationKind": "query",
    "text": "query patchFieldMetadataServiceQuery {\n  fieldConnection: field_connection {\n    edges {\n      node {\n        id\n        calculation\n        description\n        fieldDimensionMappings: field_dimension_mappings {\n          dimension {\n            id\n            name\n          }\n          id\n        }\n        fieldCategoryMappings: field_category_mappings {\n          category {\n            id\n            name\n          }\n          id\n        }\n        fieldPipelineDatasourceMappings: field_pipeline_datasource_mappings {\n          pipelineDatasource: pipeline_datasource {\n            id\n            name\n          }\n          id\n        }\n      }\n    }\n  }\n  categoryConnection: category_connection {\n    edges {\n      node {\n        id\n        name\n        parent {\n          id\n        }\n      }\n    }\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = 'c774a10f15af823a20d18210a8f7293a';

export default node;
