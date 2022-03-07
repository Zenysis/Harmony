/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type CategoryGroupRow_category$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type ParentCategoryChange_category$ref: FragmentReference;
declare export opaque type ParentCategoryChange_category$fragmentType: ParentCategoryChange_category$ref;
export type ParentCategoryChange_category = {|
  +id: string,
  +parent: ?{|
    +id: string,
    +children: $ReadOnlyArray<{|
      +id: string
    |}>,
  |},
  +children: $ReadOnlyArray<{|
    +id: string
  |}>,
  +$fragmentRefs: CategoryGroupRow_category$ref,
  +$refType: ParentCategoryChange_category$ref,
|};
export type ParentCategoryChange_category$data = ParentCategoryChange_category;
export type ParentCategoryChange_category$key = {
  +$data?: ParentCategoryChange_category$data,
  +$fragmentRefs: ParentCategoryChange_category$ref,
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
v1 = {
  "alias": null,
  "args": null,
  "concreteType": "category",
  "kind": "LinkedField",
  "name": "children",
  "plural": true,
  "selections": [
    (v0/*: any*/)
  ],
  "storageKey": null
};
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "ParentCategoryChange_category",
  "selections": [
    (v0/*: any*/),
    {
      "alias": null,
      "args": null,
      "concreteType": "category",
      "kind": "LinkedField",
      "name": "parent",
      "plural": false,
      "selections": [
        (v0/*: any*/),
        (v1/*: any*/)
      ],
      "storageKey": null
    },
    (v1/*: any*/),
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "CategoryGroupRow_category"
    }
  ],
  "type": "category",
  "abstractKey": null
};
})();
// prettier-ignore
(node/*: any*/).hash = '727772463295510b3f98342bfe8f83d4';

export default node;
