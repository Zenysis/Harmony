/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type useDimensionList_dimensionConnection$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type CopyIndicatorView_dimensionConnection$ref: FragmentReference;
declare export opaque type CopyIndicatorView_dimensionConnection$fragmentType: CopyIndicatorView_dimensionConnection$ref;
export type CopyIndicatorView_dimensionConnection = {|
  +$fragmentRefs: useDimensionList_dimensionConnection$ref,
  +$refType: CopyIndicatorView_dimensionConnection$ref,
|};
export type CopyIndicatorView_dimensionConnection$data = CopyIndicatorView_dimensionConnection;
export type CopyIndicatorView_dimensionConnection$key = {
  +$data?: CopyIndicatorView_dimensionConnection$data,
  +$fragmentRefs: CopyIndicatorView_dimensionConnection$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "CopyIndicatorView_dimensionConnection",
  "selections": [
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "useDimensionList_dimensionConnection"
    }
  ],
  "type": "dimensionConnection",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = '687f6a7c9484ad03f7e31225de46c591';

export default node;
