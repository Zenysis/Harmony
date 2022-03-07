/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
type FieldAboutPanelContent_field$ref = any;
export type FieldAboutPanelQueryVariables = {|
  id: string
|};
export type FieldAboutPanelQueryResponse = {|
  +node: ?{|
    +$fragmentRefs: FieldAboutPanelContent_field$ref
  |}
|};
export type FieldAboutPanelQuery = {|
  variables: FieldAboutPanelQueryVariables,
  response: FieldAboutPanelQueryResponse,
|};
*/


/*
query FieldAboutPanelQuery(
  $id: ID!
) {
  node(id: $id) {
    __typename
    ... on field {
      ...FieldAboutPanelContent_field
    }
    id
  }
}

fragment FieldAboutPanelContent_field on field {
  name
  description
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
  ...useFieldCalculation_field
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
},
v4 = [
  (v2/*: any*/),
  (v3/*: any*/)
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "FieldAboutPanelQuery",
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
                "name": "FieldAboutPanelContent_field"
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
    "name": "FieldAboutPanelQuery",
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
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "description",
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
                    "selections": (v4/*: any*/),
                    "storageKey": null
                  },
                  (v2/*: any*/)
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
                    "selections": (v4/*: any*/),
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
            "type": "field",
            "abstractKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "cc7d947adcdc1c350b8e3c12443a1325",
    "id": null,
    "metadata": {},
    "name": "FieldAboutPanelQuery",
    "operationKind": "query",
    "text": "query FieldAboutPanelQuery(\n  $id: ID!\n) {\n  node(id: $id) {\n    __typename\n    ... on field {\n      ...FieldAboutPanelContent_field\n    }\n    id\n  }\n}\n\nfragment FieldAboutPanelContent_field on field {\n  name\n  description\n  fieldCategoryMappings: field_category_mappings {\n    category {\n      id\n      name\n    }\n    id\n  }\n  fieldPipelineDatasourceMappings: field_pipeline_datasource_mappings {\n    pipelineDatasource: pipeline_datasource {\n      id\n      name\n    }\n    id\n  }\n  ...useFieldCalculation_field\n}\n\nfragment useFieldCalculation_field on field {\n  serializedCalculation: calculation\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = 'b417d094864eeb5cc717a17183ed12bb';

export default node;
