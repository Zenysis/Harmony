/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
export type BatchPublishModalContentsQueryVariables = {||};
export type BatchPublishModalContentsQueryResponse = {|
  +publishableFields: {|
    +edges: $ReadOnlyArray<{|
      +node: {|
        +id: string,
        +name: ?string,
        +shortName: ?string,
        +description: ?string,
        +calculation: ?any,
        +unpublishedFieldCategoryMappings: $ReadOnlyArray<{|
          +categoryId: string
        |}>,
        +unpublishedFieldPipelineDatasourceMappings: $ReadOnlyArray<{|
          +pipelineDatasourceId: string
        |}>,
      |}
    |}>
  |}
|};
export type BatchPublishModalContentsQuery = {|
  variables: BatchPublishModalContentsQueryVariables,
  response: BatchPublishModalContentsQueryResponse,
|};
*/


/*
query BatchPublishModalContentsQuery {
  publishableFields: unpublished_field_connection(where: {_and: {calculation: {_is_null: false}, id: {_is_null: false}, name: {_is_null: false}, short_name: {_is_null: false}, unpublished_field_category_mappings: {id: {_is_null: false}}, unpublished_field_pipeline_datasource_mappings: {id: {_is_null: false}}}}) {
    edges {
      node {
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
      }
    }
  }
}
*/

const node/*: ConcreteRequest*/ = (function(){
var v0 = {
  "_is_null": false
},
v1 = {
  "id": (v0/*: any*/)
},
v2 = [
  {
    "kind": "Literal",
    "name": "where",
    "value": {
      "_and": {
        "calculation": (v0/*: any*/),
        "id": (v0/*: any*/),
        "name": (v0/*: any*/),
        "short_name": (v0/*: any*/),
        "unpublished_field_category_mappings": (v1/*: any*/),
        "unpublished_field_pipeline_datasource_mappings": (v1/*: any*/)
      }
    }
  }
],
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v5 = {
  "alias": "shortName",
  "args": null,
  "kind": "ScalarField",
  "name": "short_name",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "description",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "calculation",
  "storageKey": null
},
v8 = {
  "alias": "categoryId",
  "args": null,
  "kind": "ScalarField",
  "name": "category_id",
  "storageKey": null
},
v9 = {
  "alias": "pipelineDatasourceId",
  "args": null,
  "kind": "ScalarField",
  "name": "pipeline_datasource_id",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "BatchPublishModalContentsQuery",
    "selections": [
      {
        "alias": "publishableFields",
        "args": (v2/*: any*/),
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
                  (v3/*: any*/),
                  (v4/*: any*/),
                  (v5/*: any*/),
                  (v6/*: any*/),
                  (v7/*: any*/),
                  {
                    "alias": "unpublishedFieldCategoryMappings",
                    "args": null,
                    "concreteType": "unpublished_field_category_mapping",
                    "kind": "LinkedField",
                    "name": "unpublished_field_category_mappings",
                    "plural": true,
                    "selections": [
                      (v8/*: any*/)
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
                      (v9/*: any*/)
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
        "storageKey": "unpublished_field_connection(where:{\"_and\":{\"calculation\":{\"_is_null\":false},\"id\":{\"_is_null\":false},\"name\":{\"_is_null\":false},\"short_name\":{\"_is_null\":false},\"unpublished_field_category_mappings\":{\"id\":{\"_is_null\":false}},\"unpublished_field_pipeline_datasource_mappings\":{\"id\":{\"_is_null\":false}}}})"
      }
    ],
    "type": "query_root",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "BatchPublishModalContentsQuery",
    "selections": [
      {
        "alias": "publishableFields",
        "args": (v2/*: any*/),
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
                  (v3/*: any*/),
                  (v4/*: any*/),
                  (v5/*: any*/),
                  (v6/*: any*/),
                  (v7/*: any*/),
                  {
                    "alias": "unpublishedFieldCategoryMappings",
                    "args": null,
                    "concreteType": "unpublished_field_category_mapping",
                    "kind": "LinkedField",
                    "name": "unpublished_field_category_mappings",
                    "plural": true,
                    "selections": [
                      (v8/*: any*/),
                      (v3/*: any*/)
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
                      (v9/*: any*/),
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
        ],
        "storageKey": "unpublished_field_connection(where:{\"_and\":{\"calculation\":{\"_is_null\":false},\"id\":{\"_is_null\":false},\"name\":{\"_is_null\":false},\"short_name\":{\"_is_null\":false},\"unpublished_field_category_mappings\":{\"id\":{\"_is_null\":false}},\"unpublished_field_pipeline_datasource_mappings\":{\"id\":{\"_is_null\":false}}}})"
      }
    ]
  },
  "params": {
    "cacheID": "e05ccfbe0939e910cd37baaa8b076074",
    "id": null,
    "metadata": {},
    "name": "BatchPublishModalContentsQuery",
    "operationKind": "query",
    "text": "query BatchPublishModalContentsQuery {\n  publishableFields: unpublished_field_connection(where: {_and: {calculation: {_is_null: false}, id: {_is_null: false}, name: {_is_null: false}, short_name: {_is_null: false}, unpublished_field_category_mappings: {id: {_is_null: false}}, unpublished_field_pipeline_datasource_mappings: {id: {_is_null: false}}}}) {\n    edges {\n      node {\n        id\n        name\n        shortName: short_name\n        description\n        calculation\n        unpublishedFieldCategoryMappings: unpublished_field_category_mappings {\n          categoryId: category_id\n          id\n        }\n        unpublishedFieldPipelineDatasourceMappings: unpublished_field_pipeline_datasource_mappings {\n          pipelineDatasourceId: pipeline_datasource_id\n          id\n        }\n      }\n    }\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = '72484bc5c2c26b8cf82f2ec59683cf4f';

export default node;
