/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type useFieldCalculation_field$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type CalculationRow_field$ref: FragmentReference;
declare export opaque type CalculationRow_field$fragmentType: CalculationRow_field$ref;
export type CalculationRow_field = {|
  +id: string,
  +$fragmentRefs: useFieldCalculation_field$ref,
  +$refType: CalculationRow_field$ref,
|};
export type CalculationRow_field$data = CalculationRow_field;
export type CalculationRow_field$key = {
  +$data?: CalculationRow_field$data,
  +$fragmentRefs: CalculationRow_field$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "CalculationRow_field",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "id",
      "storageKey": null
    },
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "useFieldCalculation_field"
    }
  ],
  "type": "field",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = '3b5f6889bdfce3d96780ad99a0822a41';

export default node;
