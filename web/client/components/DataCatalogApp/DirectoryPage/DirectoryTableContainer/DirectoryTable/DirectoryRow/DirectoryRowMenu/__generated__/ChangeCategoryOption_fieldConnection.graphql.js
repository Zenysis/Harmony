/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type useFilterHierarchy_fieldConnection$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type ChangeCategoryOption_fieldConnection$ref: FragmentReference;
declare export opaque type ChangeCategoryOption_fieldConnection$fragmentType: ChangeCategoryOption_fieldConnection$ref;
export type ChangeCategoryOption_fieldConnection = {|
  +$fragmentRefs: useFilterHierarchy_fieldConnection$ref,
  +$refType: ChangeCategoryOption_fieldConnection$ref,
|};
export type ChangeCategoryOption_fieldConnection$data = ChangeCategoryOption_fieldConnection;
export type ChangeCategoryOption_fieldConnection$key = {
  +$data?: ChangeCategoryOption_fieldConnection$data,
  +$fragmentRefs: ChangeCategoryOption_fieldConnection$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "ChangeCategoryOption_fieldConnection",
  "selections": [
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "useFilterHierarchy_fieldConnection"
    }
  ],
  "type": "fieldConnection",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = '13ba9791f839f00fe773375985e06901';

export default node;
