/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type useCategoryContentCount_category$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type ParentCategoryChange_fieldCategoryMapping$ref: FragmentReference;
declare export opaque type ParentCategoryChange_fieldCategoryMapping$fragmentType: ParentCategoryChange_fieldCategoryMapping$ref;
export type ParentCategoryChange_fieldCategoryMapping = {|
  +field: {|
    +id: string,
    +field_category_mappings: $ReadOnlyArray<{|
      +category: {|
        +id: string
      |},
      +visibilityStatus: any,
    |}>,
  |},
  +category: {|
    +field_category_mappings: $ReadOnlyArray<{|
      +field: {|
        +id: string
      |}
    |}>,
    +$fragmentRefs: useCategoryContentCount_category$ref,
  |},
  +$refType: ParentCategoryChange_fieldCategoryMapping$ref,
|};
export type ParentCategoryChange_fieldCategoryMapping$data = ParentCategoryChange_fieldCategoryMapping;
export type ParentCategoryChange_fieldCategoryMapping$key = {
  +$data?: ParentCategoryChange_fieldCategoryMapping$data,
  +$fragmentRefs: ParentCategoryChange_fieldCategoryMapping$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v1 = [
  (v0/*: any*/)
];
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "ParentCategoryChange_fieldCategoryMapping",
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "field",
      "kind": "LinkedField",
      "name": "field",
      "plural": false,
      "selections": [
        (v0/*: any*/),
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
              "selections": (v1/*: any*/),
              "storageKey": null
            },
            {
              "alias": "visibilityStatus",
              "args": null,
              "kind": "ScalarField",
              "name": "visibility_status",
              "storageKey": null
            }
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
              "selections": (v1/*: any*/),
              "storageKey": null
            }
          ],
          "storageKey": null
        },
        {
          "args": null,
          "kind": "FragmentSpread",
          "name": "useCategoryContentCount_category"
        }
      ],
      "storageKey": null
    }
  ],
  "type": "field_category_mapping",
  "abstractKey": null
};
})();
// prettier-ignore
(node/*: any*/).hash = '0007346b2e19f130552bb05cc42df081';

export default node;
