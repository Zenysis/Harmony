/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type useDimensionList_dimensionConnection$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type EditableCalculation_dimensionConnection$ref: FragmentReference;
declare export opaque type EditableCalculation_dimensionConnection$fragmentType: EditableCalculation_dimensionConnection$ref;
export type EditableCalculation_dimensionConnection = {|
  +$fragmentRefs: useDimensionList_dimensionConnection$ref,
  +$refType: EditableCalculation_dimensionConnection$ref,
|};
export type EditableCalculation_dimensionConnection$data = EditableCalculation_dimensionConnection;
export type EditableCalculation_dimensionConnection$key = {
  +$data?: EditableCalculation_dimensionConnection$data,
  +$fragmentRefs: EditableCalculation_dimensionConnection$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "EditableCalculation_dimensionConnection",
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
(node/*: any*/).hash = '78df72a86c8b81dc020980c5de50c204';

export default node;
