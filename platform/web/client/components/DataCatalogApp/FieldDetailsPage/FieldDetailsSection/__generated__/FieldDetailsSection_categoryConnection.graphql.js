/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type CategoryRow_categoryConnection$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type FieldDetailsSection_categoryConnection$ref: FragmentReference;
declare export opaque type FieldDetailsSection_categoryConnection$fragmentType: FieldDetailsSection_categoryConnection$ref;
export type FieldDetailsSection_categoryConnection = {|
  +$fragmentRefs: CategoryRow_categoryConnection$ref,
  +$refType: FieldDetailsSection_categoryConnection$ref,
|};
export type FieldDetailsSection_categoryConnection$data = FieldDetailsSection_categoryConnection;
export type FieldDetailsSection_categoryConnection$key = {
  +$data?: FieldDetailsSection_categoryConnection$data,
  +$fragmentRefs: FieldDetailsSection_categoryConnection$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "FieldDetailsSection_categoryConnection",
  "selections": [
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "CategoryRow_categoryConnection"
    }
  ],
  "type": "categoryConnection",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = 'dbd9d3dc0fc3639b8963a09467356de9';

export default node;
