/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type useFilterHierarchy_categoryConnection$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type CategoryRow_categoryConnection$ref: FragmentReference;
declare export opaque type CategoryRow_categoryConnection$fragmentType: CategoryRow_categoryConnection$ref;
export type CategoryRow_categoryConnection = {|
  +$fragmentRefs: useFilterHierarchy_categoryConnection$ref,
  +$refType: CategoryRow_categoryConnection$ref,
|};
export type CategoryRow_categoryConnection$data = CategoryRow_categoryConnection;
export type CategoryRow_categoryConnection$key = {
  +$data?: CategoryRow_categoryConnection$data,
  +$fragmentRefs: CategoryRow_categoryConnection$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "CategoryRow_categoryConnection",
  "selections": [
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "useFilterHierarchy_categoryConnection"
    }
  ],
  "type": "categoryConnection",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = 'c1fb26bd61a6a12fb9f996c016567ac0';

export default node;
