/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type IndicatorFormulaModalWrapper_categoryConnection$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type FieldCalculationSection_categoryConnection$ref: FragmentReference;
declare export opaque type FieldCalculationSection_categoryConnection$fragmentType: FieldCalculationSection_categoryConnection$ref;
export type FieldCalculationSection_categoryConnection = {|
  +$fragmentRefs: IndicatorFormulaModalWrapper_categoryConnection$ref,
  +$refType: FieldCalculationSection_categoryConnection$ref,
|};
export type FieldCalculationSection_categoryConnection$data = FieldCalculationSection_categoryConnection;
export type FieldCalculationSection_categoryConnection$key = {
  +$data?: FieldCalculationSection_categoryConnection$data,
  +$fragmentRefs: FieldCalculationSection_categoryConnection$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "FieldCalculationSection_categoryConnection",
  "selections": [
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "IndicatorFormulaModalWrapper_categoryConnection"
    }
  ],
  "type": "categoryConnection",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = '4d9f53f2cddbd6c91760bd349080ae4f';

export default node;
