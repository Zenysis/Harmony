/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type useCategoryContentCount_category$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type CategoryGroupRow_category$ref: FragmentReference;
declare export opaque type CategoryGroupRow_category$fragmentType: CategoryGroupRow_category$ref;
export type CategoryGroupRow_category = {|
  +id: string,
  +name: string,
  +visibilityStatus: any,
  +$fragmentRefs: useCategoryContentCount_category$ref,
  +$refType: CategoryGroupRow_category$ref,
|};
export type CategoryGroupRow_category$data = CategoryGroupRow_category;
export type CategoryGroupRow_category$key = {
  +$data?: CategoryGroupRow_category$data,
  +$fragmentRefs: CategoryGroupRow_category$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "CategoryGroupRow_category",
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
      "args": null,
      "kind": "FragmentSpread",
      "name": "useCategoryContentCount_category"
    }
  ],
  "type": "category",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = '56b959950f0050653e7e9977724ba674';

export default node;
