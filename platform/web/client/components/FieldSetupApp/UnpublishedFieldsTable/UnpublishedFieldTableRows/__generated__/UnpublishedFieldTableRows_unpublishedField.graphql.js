/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type UnpublishedFieldRow_unpublishedField$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type UnpublishedFieldTableRows_unpublishedField$ref: FragmentReference;
declare export opaque type UnpublishedFieldTableRows_unpublishedField$fragmentType: UnpublishedFieldTableRows_unpublishedField$ref;
export type UnpublishedFieldTableRows_unpublishedField = {|
  +unpublishedFieldConnection: {|
    +edges: $ReadOnlyArray<{|
      +node: {|
        +id: string,
        +$fragmentRefs: UnpublishedFieldRow_unpublishedField$ref,
      |}
    |}>,
    +pageInfo: {|
      +hasNextPage: boolean,
      +endCursor: string,
    |},
  |},
  +$refType: UnpublishedFieldTableRows_unpublishedField$ref,
|};
export type UnpublishedFieldTableRows_unpublishedField$data = UnpublishedFieldTableRows_unpublishedField;
export type UnpublishedFieldTableRows_unpublishedField$key = {
  +$data?: UnpublishedFieldTableRows_unpublishedField$data,
  +$fragmentRefs: UnpublishedFieldTableRows_unpublishedField$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = (function(){
var v0 = [
  "unpublishedFieldConnection"
],
v1 = [
  {
    "kind": "Variable",
    "name": "_ilike",
    "variableName": "searchText"
  }
],
v2 = [
  {
    "fields": (v1/*: any*/),
    "kind": "ObjectValue",
    "name": "name"
  }
];
return {
  "argumentDefinitions": [
    {
      "defaultValue": null,
      "kind": "LocalArgument",
      "name": "after"
    },
    {
      "defaultValue": null,
      "kind": "LocalArgument",
      "name": "first"
    },
    {
      "defaultValue": null,
      "kind": "LocalArgument",
      "name": "searchText"
    }
  ],
  "kind": "Fragment",
  "metadata": {
    "connection": [
      {
        "count": "first",
        "cursor": "after",
        "direction": "forward",
        "path": (v0/*: any*/)
      }
    ],
    "refetch": {
      "connection": {
        "forward": {
          "count": "first",
          "cursor": "after"
        },
        "backward": null,
        "path": (v0/*: any*/)
      },
      "fragmentPathInResult": [],
      "operation": require('./UnpublishedFieldTableRowsPaginationQuery.graphql.js')
    }
  },
  "name": "UnpublishedFieldTableRows_unpublishedField",
  "selections": [
    {
      "alias": "unpublishedFieldConnection",
      "args": [
        {
          "fields": [
            {
              "items": [
                {
                  "fields": [
                    {
                      "fields": (v1/*: any*/),
                      "kind": "ObjectValue",
                      "name": "id"
                    }
                  ],
                  "kind": "ObjectValue",
                  "name": "_or.0"
                },
                {
                  "fields": (v2/*: any*/),
                  "kind": "ObjectValue",
                  "name": "_or.1"
                },
                {
                  "fields": [
                    {
                      "fields": (v1/*: any*/),
                      "kind": "ObjectValue",
                      "name": "short_name"
                    }
                  ],
                  "kind": "ObjectValue",
                  "name": "_or.2"
                },
                {
                  "fields": [
                    {
                      "fields": (v1/*: any*/),
                      "kind": "ObjectValue",
                      "name": "description"
                    }
                  ],
                  "kind": "ObjectValue",
                  "name": "_or.3"
                },
                {
                  "fields": [
                    {
                      "fields": [
                        {
                          "fields": (v2/*: any*/),
                          "kind": "ObjectValue",
                          "name": "category"
                        }
                      ],
                      "kind": "ObjectValue",
                      "name": "unpublished_field_category_mappings"
                    }
                  ],
                  "kind": "ObjectValue",
                  "name": "_or.4"
                },
                {
                  "fields": [
                    {
                      "fields": [
                        {
                          "fields": (v2/*: any*/),
                          "kind": "ObjectValue",
                          "name": "pipeline_datasource"
                        }
                      ],
                      "kind": "ObjectValue",
                      "name": "unpublished_field_pipeline_datasource_mappings"
                    }
                  ],
                  "kind": "ObjectValue",
                  "name": "_or.5"
                }
              ],
              "kind": "ListValue",
              "name": "_or"
            }
          ],
          "kind": "ObjectValue",
          "name": "where"
        }
      ],
      "concreteType": "unpublished_fieldConnection",
      "kind": "LinkedField",
      "name": "__UnpublishedFieldTableRows_unpublishedFieldConnection_connection",
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
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "id",
                  "storageKey": null
                },
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "__typename",
                  "storageKey": null
                },
                {
                  "args": null,
                  "kind": "FragmentSpread",
                  "name": "UnpublishedFieldRow_unpublishedField"
                }
              ],
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "cursor",
              "storageKey": null
            }
          ],
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "concreteType": "PageInfo",
          "kind": "LinkedField",
          "name": "pageInfo",
          "plural": false,
          "selections": [
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "hasNextPage",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "endCursor",
              "storageKey": null
            }
          ],
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "query_root",
  "abstractKey": null
};
})();
// prettier-ignore
(node/*: any*/).hash = '4cad595bc5bc482c0a55202511eae1d6';

export default node;
