/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
type UnpublishedFieldRow_unpublishedField$ref = any;
export type UpdateCalculationActionMutationVariables = {|
  id: string,
  calculation: any,
|};
export type UpdateCalculationActionMutationResponse = {|
  +update_unpublished_field_by_pk: ?{|
    +id: string,
    +calculation: ?any,
    +$fragmentRefs: UnpublishedFieldRow_unpublishedField$ref,
  |}
|};
export type UpdateCalculationActionMutation = {|
  variables: UpdateCalculationActionMutationVariables,
  response: UpdateCalculationActionMutationResponse,
|};
*/


/*
mutation UpdateCalculationActionMutation(
  $id: String!
  $calculation: jsonb!
) {
  update_unpublished_field_by_pk(pk_columns: {id: $id}, _set: {calculation: $calculation}) {
    id
    calculation
    ...UnpublishedFieldRow_unpublishedField
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
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "calculation"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "id"
},
v2 = [
  {
    "fields": [
      {
        "kind": "Variable",
        "name": "calculation",
        "variableName": "calculation"
      }
    ],
    "kind": "ObjectValue",
    "name": "_set"
  },
  {
    "fields": [
      {
        "kind": "Variable",
        "name": "id",
        "variableName": "id"
      }
    ],
    "kind": "ObjectValue",
    "name": "pk_columns"
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
  "name": "calculation",
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
  (v3/*: any*/),
  (v5/*: any*/)
];
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "UpdateCalculationActionMutation",
    "selections": [
      {
        "alias": null,
        "args": (v2/*: any*/),
        "concreteType": "unpublished_field",
        "kind": "LinkedField",
        "name": "update_unpublished_field_by_pk",
        "plural": false,
        "selections": [
          (v3/*: any*/),
          (v4/*: any*/),
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "UnpublishedFieldRow_unpublishedField"
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
    "argumentDefinitions": [
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "UpdateCalculationActionMutation",
    "selections": [
      {
        "alias": null,
        "args": (v2/*: any*/),
        "concreteType": "unpublished_field",
        "kind": "LinkedField",
        "name": "update_unpublished_field_by_pk",
        "plural": false,
        "selections": [
          (v3/*: any*/),
          (v4/*: any*/),
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
              (v3/*: any*/),
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
              (v3/*: any*/),
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
    ]
  },
  "params": {
    "cacheID": "6da56c79f1b9a0920b83ebe26374527d",
    "id": null,
    "metadata": {},
    "name": "UpdateCalculationActionMutation",
    "operationKind": "mutation",
    "text": "mutation UpdateCalculationActionMutation(\n  $id: String!\n  $calculation: jsonb!\n) {\n  update_unpublished_field_by_pk(pk_columns: {id: $id}, _set: {calculation: $calculation}) {\n    id\n    calculation\n    ...UnpublishedFieldRow_unpublishedField\n  }\n}\n\nfragment CalculationInput_unpublishedField on unpublished_field {\n  id\n  ...useUnpublishedFieldCalculation_unpublishedField\n}\n\nfragment CategoryInput_unpublishedField on unpublished_field {\n  id\n  unpublishedFieldCategoryMappings: unpublished_field_category_mappings {\n    category {\n      id\n      name\n    }\n    id\n  }\n}\n\nfragment DatasourceInput_unpublishedField on unpublished_field {\n  id\n  unpublishedFieldPipelineDatasourceMappings: unpublished_field_pipeline_datasource_mappings {\n    datasource: pipeline_datasource {\n      id\n      name\n    }\n    id\n  }\n}\n\nfragment DescriptionInput_unpublishedField on unpublished_field {\n  id\n  description\n}\n\nfragment NameInput_unpublishedField on unpublished_field {\n  id\n  name\n}\n\nfragment ShortNameInput_unpublishedField on unpublished_field {\n  id\n  shortName: short_name\n}\n\nfragment UnpublishedFieldRow_unpublishedField on unpublished_field {\n  id\n  name\n  shortName: short_name\n  description\n  calculation\n  unpublishedFieldCategoryMappings: unpublished_field_category_mappings {\n    categoryId: category_id\n    id\n  }\n  unpublishedFieldPipelineDatasourceMappings: unpublished_field_pipeline_datasource_mappings {\n    pipelineDatasourceId: pipeline_datasource_id\n    id\n  }\n  ...CalculationInput_unpublishedField\n  ...CategoryInput_unpublishedField\n  ...DatasourceInput_unpublishedField\n  ...DescriptionInput_unpublishedField\n  ...NameInput_unpublishedField\n  ...ShortNameInput_unpublishedField\n}\n\nfragment useUnpublishedFieldCalculation_unpublishedField on unpublished_field {\n  serializedCalculation: calculation\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = '49ee12bcb5f17808e5e57c9292bf7a9c';

export default node;
