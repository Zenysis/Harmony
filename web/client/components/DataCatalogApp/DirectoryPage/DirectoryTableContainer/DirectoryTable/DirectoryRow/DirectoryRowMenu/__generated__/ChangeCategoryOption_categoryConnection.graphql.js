/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type useFilterHierarchy_categoryConnection$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type ChangeCategoryOption_categoryConnection$ref: FragmentReference;
declare export opaque type ChangeCategoryOption_categoryConnection$fragmentType: ChangeCategoryOption_categoryConnection$ref;
export type ChangeCategoryOption_categoryConnection = {|
  +$fragmentRefs: useFilterHierarchy_categoryConnection$ref,
  +$refType: ChangeCategoryOption_categoryConnection$ref,
|};
export type ChangeCategoryOption_categoryConnection$data = ChangeCategoryOption_categoryConnection;
export type ChangeCategoryOption_categoryConnection$key = {
  +$data?: ChangeCategoryOption_categoryConnection$data,
  +$fragmentRefs: ChangeCategoryOption_categoryConnection$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "ChangeCategoryOption_categoryConnection",
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
(node/*: any*/).hash = '9307705e02d3822877fc083f776d80df';

export default node;
