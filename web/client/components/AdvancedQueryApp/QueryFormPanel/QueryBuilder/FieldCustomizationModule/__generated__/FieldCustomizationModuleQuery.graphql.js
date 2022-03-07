/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
type FieldMetadataBlock_field$ref = any;
export type FieldCustomizationModuleQueryVariables = {|
  id: string
|};
export type FieldCustomizationModuleQueryResponse = {|
  +node: ?{|
    +$fragmentRefs: FieldMetadataBlock_field$ref
  |}
|};
export type FieldCustomizationModuleQuery = {|
  variables: FieldCustomizationModuleQueryVariables,
  response: FieldCustomizationModuleQueryResponse,
|};
*/


/*
query FieldCustomizationModuleQuery(
  $id: ID!
) {
  node(id: $id) {
    __typename
    ... on field {
      ...FieldMetadataBlock_field
    }
    id
  }
}

fragment FieldCalculationStatsBlock_field on field {
  ...useFieldCalculation_field
}

fragment FieldDatasourceBlock_field on field {
  fieldPipelineDatasourceMappings: field_pipeline_datasource_mappings {
    pipelineDatasource: pipeline_datasource {
      id
      name
    }
    id
  }
}

fragment FieldDescriptionBlock_field on field {
  description
}

fragment FieldMetadataBlock_field on field {
  fieldCategoryMappings: field_category_mappings {
    category {
      id
    }
    id
  }
  ...FieldCalculationStatsBlock_field
  ...FieldDatasourceBlock_field
  ...FieldDescriptionBlock_field
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
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "FieldCustomizationModuleQuery",
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
                "name": "FieldMetadataBlock_field"
              }
            ],
            "type": "field",
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
    "name": "FieldCustomizationModuleQuery",
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
                    "selections": [
                      (v2/*: any*/)
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
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "name",
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
                  },
                  (v2/*: any*/)
                ],
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "description",
                "storageKey": null
              }
            ],
            "type": "field",
            "abstractKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "13a17a3092622dbfb2eadb0254aed5aa",
    "id": null,
    "metadata": {},
    "name": "FieldCustomizationModuleQuery",
    "operationKind": "query",
    "text": "query FieldCustomizationModuleQuery(\n  $id: ID!\n) {\n  node(id: $id) {\n    __typename\n    ... on field {\n      ...FieldMetadataBlock_field\n    }\n    id\n  }\n}\n\nfragment FieldCalculationStatsBlock_field on field {\n  ...useFieldCalculation_field\n}\n\nfragment FieldDatasourceBlock_field on field {\n  fieldPipelineDatasourceMappings: field_pipeline_datasource_mappings {\n    pipelineDatasource: pipeline_datasource {\n      id\n      name\n    }\n    id\n  }\n}\n\nfragment FieldDescriptionBlock_field on field {\n  description\n}\n\nfragment FieldMetadataBlock_field on field {\n  fieldCategoryMappings: field_category_mappings {\n    category {\n      id\n    }\n    id\n  }\n  ...FieldCalculationStatsBlock_field\n  ...FieldDatasourceBlock_field\n  ...FieldDescriptionBlock_field\n}\n\nfragment useFieldCalculation_field on field {\n  serializedCalculation: calculation\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = 'd8ea10270733c8d9d8a24f5d0b206a2a';

export default node;
