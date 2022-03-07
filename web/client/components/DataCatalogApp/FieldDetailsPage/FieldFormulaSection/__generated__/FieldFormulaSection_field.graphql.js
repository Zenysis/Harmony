/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type useFieldCalculation_field$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type FieldFormulaSection_field$ref: FragmentReference;
declare export opaque type FieldFormulaSection_field$fragmentType: FieldFormulaSection_field$ref;
export type FieldFormulaSection_field = {|
  +$fragmentRefs: useFieldCalculation_field$ref,
  +$refType: FieldFormulaSection_field$ref,
|};
export type FieldFormulaSection_field$data = FieldFormulaSection_field;
export type FieldFormulaSection_field$key = {
  +$data?: FieldFormulaSection_field$data,
  +$fragmentRefs: FieldFormulaSection_field$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "FieldFormulaSection_field",
  "selections": [
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
(node/*: any*/).hash = '1bf99310621fe2738550c361a2f993e2';

export default node;
