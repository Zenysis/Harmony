/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type ChangeCategoryOption_fieldConnection$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type DirectoryRowMenu_fieldConnection$ref: FragmentReference;
declare export opaque type DirectoryRowMenu_fieldConnection$fragmentType: DirectoryRowMenu_fieldConnection$ref;
export type DirectoryRowMenu_fieldConnection = {|
  +$fragmentRefs: ChangeCategoryOption_fieldConnection$ref,
  +$refType: DirectoryRowMenu_fieldConnection$ref,
|};
export type DirectoryRowMenu_fieldConnection$data = DirectoryRowMenu_fieldConnection;
export type DirectoryRowMenu_fieldConnection$key = {
  +$data?: DirectoryRowMenu_fieldConnection$data,
  +$fragmentRefs: DirectoryRowMenu_fieldConnection$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "DirectoryRowMenu_fieldConnection",
  "selections": [
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "ChangeCategoryOption_fieldConnection"
    }
  ],
  "type": "fieldConnection",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = 'd44ae92059271f418716c2d7e11bf4a5';

export default node;
