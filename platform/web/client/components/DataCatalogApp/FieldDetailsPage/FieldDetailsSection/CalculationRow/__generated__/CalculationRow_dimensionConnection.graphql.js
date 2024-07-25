/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type EditableCalculation_dimensionConnection$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type CalculationRow_dimensionConnection$ref: FragmentReference;
declare export opaque type CalculationRow_dimensionConnection$fragmentType: CalculationRow_dimensionConnection$ref;
export type CalculationRow_dimensionConnection = {|
  +$fragmentRefs: EditableCalculation_dimensionConnection$ref,
  +$refType: CalculationRow_dimensionConnection$ref,
|};
export type CalculationRow_dimensionConnection$data = CalculationRow_dimensionConnection;
export type CalculationRow_dimensionConnection$key = {
  +$data?: CalculationRow_dimensionConnection$data,
  +$fragmentRefs: CalculationRow_dimensionConnection$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "CalculationRow_dimensionConnection",
  "selections": [
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "EditableCalculation_dimensionConnection"
    }
  ],
  "type": "dimensionConnection",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = 'a3bdd656372f906cdf305be893cdf40f';

export default node;
