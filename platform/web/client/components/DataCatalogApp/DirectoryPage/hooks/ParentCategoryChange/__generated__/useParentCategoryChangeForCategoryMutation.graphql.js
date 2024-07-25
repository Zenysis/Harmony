/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ConcreteRequest } from 'relay-runtime';
type ParentCategoryChange_category$ref = any;
export type useParentCategoryChangeForCategoryMutationVariables = {|
  dbCategoryId: string,
  dbNewParentCategoryId: string,
|};
export type useParentCategoryChangeForCategoryMutationResponse = {|
  +update_category: ?{|
    +returning: $ReadOnlyArray<{|
      +$fragmentRefs: ParentCategoryChange_category$ref
    |}>
  |}
|};
export type useParentCategoryChangeForCategoryMutation = {|
  variables: useParentCategoryChangeForCategoryMutationVariables,
  response: useParentCategoryChangeForCategoryMutationResponse,
|};
*/


/*
mutation useParentCategoryChangeForCategoryMutation(
  $dbCategoryId: String!
  $dbNewParentCategoryId: String!
) {
  update_category(where: {id: {_eq: $dbCategoryId}}, _set: {parent_id: $dbNewParentCategoryId}) {
    returning {
      ...ParentCategoryChange_category
      id
    }
  }
}

fragment CategoryGroupRow_category on category {
  id
  name
  visibilityStatus: visibility_status
  ...useCategoryContentCount_category
}

fragment ParentCategoryChange_category on category {
  id
  parent {
    id
    children {
      id
    }
  }
  children {
    id
  }
  ...CategoryGroupRow_category
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
    "name": "dbCategoryId"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "dbNewParentCategoryId"
  }
],
v1 = [
  {
    "fields": [
      {
        "kind": "Variable",
        "name": "parent_id",
        "variableName": "dbNewParentCategoryId"
      }
    ],
    "kind": "ObjectValue",
    "name": "_set"
  },
  {
    "fields": [
      {
        "fields": [
          {
            "kind": "Variable",
            "name": "_eq",
            "variableName": "dbCategoryId"
          }
        ],
        "kind": "ObjectValue",
        "name": "id"
      }
    ],
    "kind": "ObjectValue",
    "name": "where"
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
  "concreteType": "category",
  "kind": "LinkedField",
  "name": "children",
  "plural": true,
  "selections": [
    (v2/*: any*/)
  ],
  "storageKey": null
},
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
    "name": "useParentCategoryChangeForCategoryMutation",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "category_mutation_response",
        "kind": "LinkedField",
        "name": "update_category",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "category",
            "kind": "LinkedField",
            "name": "returning",
            "plural": true,
            "selections": [
              {
                "args": null,
                "kind": "FragmentSpread",
                "name": "ParentCategoryChange_category"
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
    "name": "useParentCategoryChangeForCategoryMutation",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "category_mutation_response",
        "kind": "LinkedField",
        "name": "update_category",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "category",
            "kind": "LinkedField",
            "name": "returning",
            "plural": true,
            "selections": [
              (v2/*: any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": "category",
                "kind": "LinkedField",
                "name": "parent",
                "plural": false,
                "selections": [
                  (v2/*: any*/),
                  (v3/*: any*/)
                ],
                "storageKey": null
              },
              (v3/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "name",
                "storageKey": null
              },
              {
                "alias": "visibilityStatus",
                "args": null,
                "kind": "ScalarField",
                "name": "visibility_status",
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
    "cacheID": "ae2c35c1f1796c1638b1782b274a6ab8",
    "id": null,
    "metadata": {},
    "name": "useParentCategoryChangeForCategoryMutation",
    "operationKind": "mutation",
    "text": "mutation useParentCategoryChangeForCategoryMutation(\n  $dbCategoryId: String!\n  $dbNewParentCategoryId: String!\n) {\n  update_category(where: {id: {_eq: $dbCategoryId}}, _set: {parent_id: $dbNewParentCategoryId}) {\n    returning {\n      ...ParentCategoryChange_category\n      id\n    }\n  }\n}\n\nfragment CategoryGroupRow_category on category {\n  id\n  name\n  visibilityStatus: visibility_status\n  ...useCategoryContentCount_category\n}\n\nfragment ParentCategoryChange_category on category {\n  id\n  parent {\n    id\n    children {\n      id\n    }\n  }\n  children {\n    id\n  }\n  ...CategoryGroupRow_category\n}\n\nfragment useCategoryContentCount_category on category {\n  fieldCategoryMappingsAggregate: field_category_mappings_aggregate {\n    aggregate {\n      count\n    }\n  }\n  childrenCategoryAggregate: children_aggregate {\n    aggregate {\n      count\n    }\n  }\n}\n"
  }
};
})();
// prettier-ignore
(node/*: any*/).hash = '2354adfb69dba126fd819c251639b514';

export default node;
