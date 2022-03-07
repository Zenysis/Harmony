/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
type ParentCategoryChange_fieldCategoryMapping$ref = any;
export type DeleteFieldModalMutationVariables = {|
  dbFieldId: string
|};
export type DeleteFieldModalMutationResponse = {|
  +delete_field_by_pk: ?{|
    +id: string,
    +fieldCategoryMapping: $ReadOnlyArray<{|
      +$fragmentRefs: ParentCategoryChange_fieldCategoryMapping$ref
    |}>,
  |}
|};
export type DeleteFieldModalMutation = {|
  variables: DeleteFieldModalMutationVariables,
  response: DeleteFieldModalMutationResponse,
|};
*/


/*
mutation DeleteFieldModalMutation(
  $dbFieldId: String!
) {
  delete_field_by_pk(id: $dbFieldId) {
    id
    fieldCategoryMapping: field_category_mappings {
      ...ParentCategoryChange_fieldCategoryMapping
      id
    }
  }
}

fragment ParentCategoryChange_fieldCategoryMapping on field_category_mapping {
  field {
    id
    field_category_mappings {
      category {
        id
      }
      visibilityStatus: visibility_status
      id
    }
  }
  category {
    field_category_mappings {
      field {
        id
      }
      id
    }
    ...useCategoryContentCount_category
    id
  }
}

fragment useCategoryContentCount_category on category {
  fieldCategoryMappingsAggregate: field_category_mappings_aggregate {
    aggregate {
      count
    }
  }
  childrenCategoryAggregate: children_aggregate {
    aggregate {
      count
    }
  }
}
*/

const node/*: ConcreteRequest*/ = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "dbFieldId"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "id",
    "variableName": "dbFieldId"
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v3 = [
  (v2/*: any*/)
],
v4 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "count",
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "DeleteFieldModalMutation",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "field",
        "kind": "LinkedField",
        "name": "delete_field_by_pk",
        "plural": false,
        "selections": [
          (v2/*: any*/),
          {
            "alias": "fieldCategoryMapping",
            "args": null,
            "concreteType": "field_category_mapping",
            "kind": "LinkedField",
            "name": "field_category_mappings",
            "plural": true,
            "selections": [
              {
                "args": null,
                "kind": "FragmentSpread",
                "name": "ParentCategoryChange_fieldCategoryMapping"
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
    "name": "DeleteFieldModalMutation",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "field",
        "kind": "LinkedField",
        "name": "delete_field_by_pk",
        "plural": false,
        "selections": [
          (v2/*: any*/),
          {
            "alias": "fieldCategoryMapping",
            "args": null,
            "concreteType": "field_category_mapping",
            "kind": "LinkedField",
            "name": "field_category_mappings",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "field",
                "kind": "LinkedField",
                "name": "field",
                "plural": false,
                "selections": [
                  (v2/*: any*/),
                  {
                    "alias": null,
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
                        "selections": (v3/*: any*/),
                        "storageKey": null
                      },
                      {
                        "alias": "visibilityStatus",
                        "args": null,
                        "kind": "ScalarField",
                        "name": "visibility_status",
                        "storageKey": null
                      },
                      (v2/*: any*/)
                    ],
                    "storageKey": null
                  }
                ],
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "category",
                "kind": "LinkedField",
                "name": "category",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "field_category_mapping",
                    "kind": "LinkedField",
                    "name": "field_category_mappings",
                    "plural": true,
                    "selections": [
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "field",
                        "kind": "LinkedField",
                        "name": "field",
                        "plural": false,
                        "selections": (v3/*: any*/),
                        "storageKey": null
                      },
                      (v2/*: any*/)
                    ],
                    "storageKey": null
                  },
                  {
                    "alias": "fieldCategoryMappingsAggregate",
                    "args": null,
                    "concreteType": "field_category_mapping_aggregate",
                    "kind": "LinkedField",
                    "name": "field_category_mappings_aggregate",
                    "plural": false,
                    "selections": [
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "field_category_mapping_aggregate_fields",
                        "kind": "LinkedField",
                        "name": "aggregate",
                        "plural": false,
                        "selections": (v4/*: any*/),
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
                  },
                  {
                    "alias": "childrenCategoryAggregate",
                    "args": null,
                    "concreteType": "category_aggregate",
                    "kind": "LinkedField",
                    "name": "children_aggregate",
                    "plural": false,
                    "selections": [
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "category_aggregate_fields",
                        "kind": "LinkedField",
                        "name": "aggregate",
                        "plural": false,
                        "selections": (v4/*: any*/),
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
                  },
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
    ]
  },
  "params": {
    "cacheID": "266cc549144b8b6a5674ee1109c5dc3a",
    "id": null,
    "metadata": {},
    "name": "DeleteFieldModalMutation",
    "operationKind": "mutation",
    "text": "mutation DeleteFieldModalMutation(\n  $dbFieldId: String!\n) {\n  delete_field_by_pk(id: $dbFieldId) {\n    id\n    fieldCategoryMapping: field_category_mappings {\n      ...ParentCategoryChange_fieldCategoryMapping\n      id\n    }\n  }\n}\n\nfragment ParentCategoryChange_fieldCategoryMapping on field_category_mapping {\n  field {\n    id\n    field_category_mappings {\n      category {\n        id\n      }\n      visibilityStatus: visibility_status\n      id\n    }\n  }\n  category {\n    field_category_mappings {\n      field {\n        id\n      }\n      id\n    }\n    ...useCategoryContentCount_category\n    id\n  }\n}\n\nfragment useCategoryContentCount_category on category {\n  fieldCategoryMappingsAggregate: field_category_mappings_aggregate {\n    aggregate {\n      count\n    }\n  }\n  childrenCategoryAggregate: children_aggregate {\n    aggregate {\n      count\n    }\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = 'd12e7623ae354f44362727bf1db320c1';

export default node;
