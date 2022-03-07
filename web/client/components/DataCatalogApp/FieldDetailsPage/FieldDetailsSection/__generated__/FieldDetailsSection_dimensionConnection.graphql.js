/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type CalculationRow_dimensionConnection$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type FieldDetailsSection_dimensionConnection$ref: FragmentReference;
declare export opaque type FieldDetailsSection_dimensionConnection$fragmentType: FieldDetailsSection_dimensionConnection$ref;
export type FieldDetailsSection_dimensionConnection = {|
  +$fragmentRefs: CalculationRow_dimensionConnection$ref,
  +$refType: FieldDetailsSection_dimensionConnection$ref,
|};
export type FieldDetailsSection_dimensionConnection$data = FieldDetailsSection_dimensionConnection;
export type FieldDetailsSection_dimensionConnection$key = {
  +$data?: FieldDetailsSection_dimensionConnection$data,
  +$fragmentRefs: FieldDetailsSection_dimensionConnection$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "FieldDetailsSection_dimensionConnection",
  "selections": [
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "CalculationRow_dimensionConnection"
    }
  ],
  "type": "dimensionConnection",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = '4649f619c6f66a5b96c96d2f95458f19';

export default node;
