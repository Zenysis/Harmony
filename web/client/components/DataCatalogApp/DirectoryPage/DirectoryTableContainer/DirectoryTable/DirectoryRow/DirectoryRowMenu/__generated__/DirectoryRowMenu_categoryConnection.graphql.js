/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type ChangeCategoryOption_categoryConnection$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type DirectoryRowMenu_categoryConnection$ref: FragmentReference;
declare export opaque type DirectoryRowMenu_categoryConnection$fragmentType: DirectoryRowMenu_categoryConnection$ref;
export type DirectoryRowMenu_categoryConnection = {|
  +$fragmentRefs: ChangeCategoryOption_categoryConnection$ref,
  +$refType: DirectoryRowMenu_categoryConnection$ref,
|};
export type DirectoryRowMenu_categoryConnection$data = DirectoryRowMenu_categoryConnection;
export type DirectoryRowMenu_categoryConnection$key = {
  +$data?: DirectoryRowMenu_categoryConnection$data,
  +$fragmentRefs: DirectoryRowMenu_categoryConnection$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "DirectoryRowMenu_categoryConnection",
  "selections": [
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "ChangeCategoryOption_categoryConnection"
    }
  ],
  "type": "categoryConnection",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = '7a6d91d85b6b2fe921c09ce556ecd855';

export default node;
