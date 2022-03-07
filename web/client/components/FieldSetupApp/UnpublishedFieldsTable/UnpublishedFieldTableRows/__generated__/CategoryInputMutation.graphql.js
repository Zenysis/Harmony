/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
type UnpublishedFieldRow_unpublishedField$ref = any;
export type CategoryInputMutationVariables = {|
  categoryId: string,
  unpublishedFieldId: string,
|};
export type CategoryInputMutationResponse = {|
  +delete_unpublished_field_category_mapping: ?{|
    +returning: $ReadOnlyArray<{|
      +id: string,
      +unpublished_field_id: string,
      +category_id: string,
    |}>
  |},
  +insert_unpublished_field_category_mapping_one: ?{|
    +id: string,
    +category: {|
      +id: string
    |},
    +unpublished_field: {|
      +id: string,
      +$fragmentRefs: UnpublishedFieldRow_unpublishedField$ref,
    |},
  |},
|};
export type CategoryInputMutation = {|
  variables: CategoryInputMutationVariables,
  response: CategoryInputMutationResponse,
|};
*/


/*
mutation CategoryInputMutation(
  $categoryId: String!
  $unpublishedFieldId: String!
) {
  delete_unpublished_field_category_mapping(where: {unpublished_field_id: {_eq: $unpublishedFieldId}}) {
    returning {
      id
      unpublished_field_id
      category_id
    }
  }
  insert_unpublished_field_category_mapping_one(object: {unpublished_field_id: $unpublishedFieldId, category_id: $categoryId}) {
    id
    category {
      id
    }
    unpublished_field {
      id
      ...UnpublishedFieldRow_unpublishedField
    }
  }
}

fragment CalculationInput_unpublishedField on unpublished_field {
  id
  ...useUnpublishedFieldCalculation_unpublishedField
}

fragment CategoryInput_unpublishedField on unpublished_field {
  id
  unpublishedFieldCategoryMappings: unpublished_field_category_mappings {
    category {
      id
      name
    }
    id
  }
}

fragment DatasourceInput_unpublishedField on unpublished_field {
  id
  unpublishedFieldPipelineDatasourceMappings: unpublished_field_pipeline_datasource_mappings {
    datasource: pipeline_datasource {
      id
      name
    }
    id
  }
}

fragment DescriptionInput_unpublishedField on unpublished_field {
  id
  description
}

fragment NameInput_unpublishedField on unpublished_field {
  id
  name
}

fragment ShortNameInput_unpublishedField on unpublished_field {
  id
  shortName: short_name
}

fragment UnpublishedFieldRow_unpublishedField on unpublished_field {
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
  ...CalculationInput_unpublishedField
  ...CategoryInput_unpublishedField
  ...DatasourceInput_unpublishedField
  ...DescriptionInput_unpublishedField
  ...NameInput_unpublishedField
  ...ShortNameInput_unpublishedField
}

fragment useUnpublishedFieldCalculation_unpublishedField on unpublished_field {
  serializedCalculation: calculation
}
*/

const node/*: ConcreteRequest*/ = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "categoryId"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "unpublishedFieldId"
  }
],
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": [
    {
      "fields": [
        {
          "fields": [
            {
              "kind": "Variable",
              "name": "_eq",
              "variableName": "unpublishedFieldId"
            }
          ],
          "kind": "ObjectValue",
          "name": "unpublished_field_id"
        }
      ],
      "kind": "ObjectValue",
      "name": "where"
    }
  ],
  "concreteType": "unpublished_field_category_mapping_mutation_response",
  "kind": "LinkedField",
  "name": "delete_unpublished_field_category_mapping",
  "plural": false,
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "unpublished_field_category_mapping",
      "kind": "LinkedField",
      "name": "returning",
      "plural": true,
      "selections": [
        (v1/*: any*/),
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "unpublished_field_id",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "category_id",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "storageKey": null
},
v3 = [
  {
    "fields": [
      {
        "kind": "Variable",
        "name": "category_id",
        "variableName": "categoryId"
      },
      {
        "kind": "Variable",
        "name": "unpublished_field_id",
        "variableName": "unpublishedFieldId"
      }
    ],
    "kind": "ObjectValue",
    "name": "object"
  }
],
v4 = {
  "alias": null,
  "args": null,
  "concreteType": "category",
  "kind": "LinkedField",
  "name": "category",
  "plural": false,
  "selections": [
    (v1/*: any*/)
  ],
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v6 = [
  (v1/*: any*/),
  (v5/*: any*/)
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "CategoryInputMutation",
    "selections": [
      (v2/*: any*/),
      {
        "alias": null,
        "args": (v3/*: any*/),
        "concreteType": "unpublished_field_category_mapping",
        "kind": "LinkedField",
        "name": "insert_unpublished_field_category_mapping_one",
        "plural": false,
        "selections": [
          (v1/*: any*/),
          (v4/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "unpublished_field",
            "kind": "LinkedField",
            "name": "unpublished_field",
            "plural": false,
            "selections": [
              (v1/*: any*/),
              {
                "args": null,
                "kind": "FragmentSpread",
                "name": "UnpublishedFieldRow_unpublishedField"
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ],
    "type": "mutation_root",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "CategoryInputMutation",
    "selections": [
      (v2/*: any*/),
      {
        "alias": null,
        "args": (v3/*: any*/),
        "concreteType": "unpublished_field_category_mapping",
        "kind": "LinkedField",
        "name": "insert_unpublished_field_category_mapping_one",
        "plural": false,
        "selections": [
          (v1/*: any*/),
          (v4/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "unpublished_field",
            "kind": "LinkedField",
            "name": "unpublished_field",
            "plural": false,
            "selections": [
              (v1/*: any*/),
              (v5/*: any*/),
              {
                "alias": "shortName",
                "args": null,
                "kind": "ScalarField",
                "name": "short_name",
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
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "calculation",
                "storageKey": null
              },
              {
                "alias": "unpublishedFieldCategoryMappings",
                "args": null,
                "concreteType": "unpublished_field_category_mapping",
                "kind": "LinkedField",
                "name": "unpublished_field_category_mappings",
                "plural": true,
                "selections": [
                  {
                    "alias": "categoryId",
                    "args": null,
                    "kind": "ScalarField",
                    "name": "category_id",
                    "storageKey": null
                  },
                  (v1/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "category",
                    "kind": "LinkedField",
                    "name": "category",
                    "plural": false,
                    "selections": (v6/*: any*/),
                    "storageKey": null
                  }
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
                  {
                    "alias": "pipelineDatasourceId",
                    "args": null,
                    "kind": "ScalarField",
                    "name": "pipeline_datasource_id",
                    "storageKey": null
                  },
                  (v1/*: any*/),
                  {
                    "alias": "datasource",
                    "args": null,
                    "concreteType": "pipeline_datasource",
                    "kind": "LinkedField",
                    "name": "pipeline_datasource",
                    "plural": false,
                    "selections": (v6/*: any*/),
                    "storageKey": null
                  }
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
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "7bc0fa0feb453f5da62b3ab2dc4c0d99",
    "id": null,
    "metadata": {},
    "name": "CategoryInputMutation",
    "operationKind": "mutation",
    "text": "mutation CategoryInputMutation(\n  $categoryId: String!\n  $unpublishedFieldId: String!\n) {\n  delete_unpublished_field_category_mapping(where: {unpublished_field_id: {_eq: $unpublishedFieldId}}) {\n    returning {\n      id\n      unpublished_field_id\n      category_id\n    }\n  }\n  insert_unpublished_field_category_mapping_one(object: {unpublished_field_id: $unpublishedFieldId, category_id: $categoryId}) {\n    id\n    category {\n      id\n    }\n    unpublished_field {\n      id\n      ...UnpublishedFieldRow_unpublishedField\n    }\n  }\n}\n\nfragment CalculationInput_unpublishedField on unpublished_field {\n  id\n  ...useUnpublishedFieldCalculation_unpublishedField\n}\n\nfragment CategoryInput_unpublishedField on unpublished_field {\n  id\n  unpublishedFieldCategoryMappings: unpublished_field_category_mappings {\n    category {\n      id\n      name\n    }\n    id\n  }\n}\n\nfragment DatasourceInput_unpublishedField on unpublished_field {\n  id\n  unpublishedFieldPipelineDatasourceMappings: unpublished_field_pipeline_datasource_mappings {\n    datasource: pipeline_datasource {\n      id\n      name\n    }\n    id\n  }\n}\n\nfragment DescriptionInput_unpublishedField on unpublished_field {\n  id\n  description\n}\n\nfragment NameInput_unpublishedField on unpublished_field {\n  id\n  name\n}\n\nfragment ShortNameInput_unpublishedField on unpublished_field {\n  id\n  shortName: short_name\n}\n\nfragment UnpublishedFieldRow_unpublishedField on unpublished_field {\n  id\n  name\n  shortName: short_name\n  description\n  calculation\n  unpublishedFieldCategoryMappings: unpublished_field_category_mappings {\n    categoryId: category_id\n    id\n  }\n  unpublishedFieldPipelineDatasourceMappings: unpublished_field_pipeline_datasource_mappings {\n    pipelineDatasourceId: pipeline_datasource_id\n    id\n  }\n  ...CalculationInput_unpublishedField\n  ...CategoryInput_unpublishedField\n  ...DatasourceInput_unpublishedField\n  ...DescriptionInput_unpublishedField\n  ...NameInput_unpublishedField\n  ...ShortNameInput_unpublishedField\n}\n\nfragment useUnpublishedFieldCalculation_unpublishedField on unpublished_field {\n  serializedCalculation: calculation\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = 'cf9e43f80afdfa50bbb80b94ce320530';

export default node;
