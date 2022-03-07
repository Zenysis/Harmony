/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
import type { FragmentReference } from "relay-runtime";
declare export opaque type useCategoryContentCount_category$ref: FragmentReference;
declare export opaque type useCategoryContentCount_category$fragmentType: useCategoryContentCount_category$ref;
export type useCategoryContentCount_category = {|
  +fieldCategoryMappingsAggregate: {|
    +aggregate: ?{|
      +count: ?number
    |}
  |},
  +childrenCategoryAggregate: {|
    +aggregate: ?{|
      +count: ?number
    |}
  |},
  +$refType: useCategoryContentCount_category$ref,
|};
export type useCategoryContentCount_category$data = useCategoryContentCount_category;
export type useCategoryContentCount_category$key = {
  +$data?: useCategoryContentCount_category$data,
  +$fragmentRefs: useCategoryContentCount_category$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "count",
    "storageKey": null
  }
];
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "useCategoryContentCount_category",
  "selections": [
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
          "selections": (v0/*: any*/),
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
          "selections": (v0/*: any*/),
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "category",
  "abstractKey": null
};
})();
// prettier-ignore
(node/*: any*/).hash = '52ea28901c7db63d1e546f38ddf26499';

export default node;
