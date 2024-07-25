/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
type ParentCategoryChange_fieldCategoryMapping$ref = any;
export type useParentCategoryChangeForFieldMutationVariables = {|
  dbFieldId: string,
  dbNewParentCategoryId: string,
  dbOriginalParentCategoryId?: ?string,
  insertNewMapping: boolean,
|};
export type useParentCategoryChangeForFieldMutationResponse = {|
  +update_field_category_mapping?: ?{|
    +returning: $ReadOnlyArray<{|
      +$fragmentRefs: ParentCategoryChange_fieldCategoryMapping$ref
    |}>
  |},
  +insert_field_category_mapping_one?: ?{|
    +$fragmentRefs: ParentCategoryChange_fieldCategoryMapping$ref
  |},
|};
export type useParentCategoryChangeForFieldMutation = {|
  variables: useParentCategoryChangeForFieldMutationVariables,
  response: useParentCategoryChangeForFieldMutationResponse,
|};
*/


/*
mutation useParentCategoryChangeForFieldMutation(
  $dbFieldId: String!
  $dbNewParentCategoryId: String!
  $dbOriginalParentCategoryId: String
  $insertNewMapping: Boolean!
) {
  update_field_category_mapping(where: {_and: {field_id: {_eq: $dbFieldId}, category_id: {_eq: $dbOriginalParentCategoryId}}}, _set: {category_id: $dbNewParentCategoryId}) @skip(if: $insertNewMapping) {
    returning {
      ...ParentCategoryChange_fieldCategoryMapping
      id
    }
  }
  insert_field_category_mapping_one(object: {category_id: $dbNewParentCategoryId, field_id: $dbFieldId}) @include(if: $insertNewMapping) {
    ...ParentCategoryChange_fieldCategoryMapping
    id
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
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "dbNewParentCategoryId"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "dbOriginalParentCategoryId"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "insertNewMapping"
  }
],
v1 = {
  "kind": "Variable",
  "name": "category_id",
  "variableName": "dbNewParentCategoryId"
},
v2 = [
  {
    "fields": [
      (v1/*: any*/)
    ],
    "kind": "ObjectValue",
    "name": "_set"
  },
  {
    "fields": [
      {
        "fields": [
          {
            "fields": [
              {
                "kind": "Variable",
                "name": "_eq",
                "variableName": "dbOriginalParentCategoryId"
              }
            ],
            "kind": "ObjectValue",
            "name": "category_id"
          },
          {
            "fields": [
              {
                "kind": "Variable",
                "name": "_eq",
                "variableName": "dbFieldId"
              }
            ],
            "kind": "ObjectValue",
            "name": "field_id"
          }
        ],
        "kind": "ObjectValue",
        "name": "_and"
      }
    ],
    "kind": "ObjectValue",
    "name": "where"
  }
],
v3 = [
  {
    "args": null,
    "kind": "FragmentSpread",
    "name": "ParentCategoryChange_fieldCategoryMapping"
  }
],
v4 = [
  {
    "fields": [
      (v1/*: any*/),
      {
        "kind": "Variable",
        "name": "field_id",
        "variableName": "dbFieldId"
      }
    ],
    "kind": "ObjectValue",
    "name": "object"
  }
],
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v6 = [
  (v5/*: any*/)
],
v7 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "count",
    "storageKey": null
  }
],
v8 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "field",
    "kind": "LinkedField",
    "name": "field",
    "plural": false,
    "selections": [
      (v5/*: any*/),
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
            "selections": (v6/*: any*/),
            "storageKey": null
          },
          {
            "alias": "visibilityStatus",
            "args": null,
            "kind": "ScalarField",
            "name": "visibility_status",
            "storageKey": null
          },
          (v5/*: any*/)
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
            "selections": (v6/*: any*/),
            "storageKey": null
          },
          (v5/*: any*/)
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
            "selections": (v7/*: any*/),
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
            "selections": (v7/*: any*/),
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      (v5/*: any*/)
    ],
    "storageKey": null
  },
  (v5/*: any*/)
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "useParentCategoryChangeForFieldMutation",
    "selections": [
      {
        "condition": "insertNewMapping",
        "kind": "Condition",
        "passingValue": false,
        "selections": [
          {
            "alias": null,
            "args": (v2/*: any*/),
            "concreteType": "field_category_mapping_mutation_response",
            "kind": "LinkedField",
            "name": "update_field_category_mapping",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "field_category_mapping",
                "kind": "LinkedField",
                "name": "returning",
                "plural": true,
                "selections": (v3/*: any*/),
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ]
      },
      {
        "condition": "insertNewMapping",
        "kind": "Condition",
        "passingValue": true,
        "selections": [
          {
            "alias": null,
            "args": (v4/*: any*/),
            "concreteType": "field_category_mapping",
            "kind": "LinkedField",
            "name": "insert_field_category_mapping_one",
            "plural": false,
            "selections": (v3/*: any*/),
            "storageKey": null
          }
        ]
      }
    ],
    "type": "mutation_root",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "useParentCategoryChangeForFieldMutation",
    "selections": [
      {
        "condition": "insertNewMapping",
        "kind": "Condition",
        "passingValue": false,
        "selections": [
          {
            "alias": null,
            "args": (v2/*: any*/),
            "concreteType": "field_category_mapping_mutation_response",
            "kind": "LinkedField",
            "name": "update_field_category_mapping",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "field_category_mapping",
                "kind": "LinkedField",
                "name": "returning",
                "plural": true,
                "selections": (v8/*: any*/),
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ]
      },
      {
        "condition": "insertNewMapping",
        "kind": "Condition",
        "passingValue": true,
        "selections": [
          {
            "alias": null,
            "args": (v4/*: any*/),
            "concreteType": "field_category_mapping",
            "kind": "LinkedField",
            "name": "insert_field_category_mapping_one",
            "plural": false,
            "selections": (v8/*: any*/),
            "storageKey": null
          }
        ]
      }
    ]
  },
  "params": {
    "cacheID": "61e35f7da8ff32756a2c9fd31cf95c5a",
    "id": null,
    "metadata": {},
    "name": "useParentCategoryChangeForFieldMutation",
    "operationKind": "mutation",
    "text": "mutation useParentCategoryChangeForFieldMutation(\n  $dbFieldId: String!\n  $dbNewParentCategoryId: String!\n  $dbOriginalParentCategoryId: String\n  $insertNewMapping: Boolean!\n) {\n  update_field_category_mapping(where: {_and: {field_id: {_eq: $dbFieldId}, category_id: {_eq: $dbOriginalParentCategoryId}}}, _set: {category_id: $dbNewParentCategoryId}) @skip(if: $insertNewMapping) {\n    returning {\n      ...ParentCategoryChange_fieldCategoryMapping\n      id\n    }\n  }\n  insert_field_category_mapping_one(object: {category_id: $dbNewParentCategoryId, field_id: $dbFieldId}) @include(if: $insertNewMapping) {\n    ...ParentCategoryChange_fieldCategoryMapping\n    id\n  }\n}\n\nfragment ParentCategoryChange_fieldCategoryMapping on field_category_mapping {\n  field {\n    id\n    field_category_mappings {\n      category {\n        id\n      }\n      visibilityStatus: visibility_status\n      id\n    }\n  }\n  category {\n    field_category_mappings {\n      field {\n        id\n      }\n      id\n    }\n    ...useCategoryContentCount_category\n    id\n  }\n}\n\nfragment useCategoryContentCount_category on category {\n  fieldCategoryMappingsAggregate: field_category_mappings_aggregate {\n    aggregate {\n      count\n    }\n  }\n  childrenCategoryAggregate: children_aggregate {\n    aggregate {\n      count\n    }\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = '42fd594f8d61c460758e039034c545f1';

export default node;
