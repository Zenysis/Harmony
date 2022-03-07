/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type useFieldCalculation_field$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type FieldCalculationSection_field$ref: FragmentReference;
declare export opaque type FieldCalculationSection_field$fragmentType: FieldCalculationSection_field$ref;
export type FieldCalculationSection_field = {|
  +fieldId: string,
  +fieldName: string,
  +$fragmentRefs: useFieldCalculation_field$ref,
  +$refType: FieldCalculationSection_field$ref,
|};
export type FieldCalculationSection_field$data = FieldCalculationSection_field;
export type FieldCalculationSection_field$key = {
  +$data?: FieldCalculationSection_field$data,
  +$fragmentRefs: FieldCalculationSection_field$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "FieldCalculationSection_field",
  "selections": [
    {
      "alias": "fieldId",
      "args": null,
      "kind": "ScalarField",
      "name": "id",
      "storageKey": null
    },
    {
      "alias": "fieldName",
      "args": null,
      "kind": "ScalarField",
      "name": "name",
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
(node/*: any*/).hash = '7da663a9b58279ee76275fc8dad561f6';

export default node;
