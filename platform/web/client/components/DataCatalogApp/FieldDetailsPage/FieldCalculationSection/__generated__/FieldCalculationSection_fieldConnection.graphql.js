/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type IndicatorFormulaModalWrapper_fieldConnection$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type FieldCalculationSection_fieldConnection$ref: FragmentReference;
declare export opaque type FieldCalculationSection_fieldConnection$fragmentType: FieldCalculationSection_fieldConnection$ref;
export type FieldCalculationSection_fieldConnection = {|
  +$fragmentRefs: IndicatorFormulaModalWrapper_fieldConnection$ref,
  +$refType: FieldCalculationSection_fieldConnection$ref,
|};
export type FieldCalculationSection_fieldConnection$data = FieldCalculationSection_fieldConnection;
export type FieldCalculationSection_fieldConnection$key = {
  +$data?: FieldCalculationSection_fieldConnection$data,
  +$fragmentRefs: FieldCalculationSection_fieldConnection$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "FieldCalculationSection_fieldConnection",
  "selections": [
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "IndicatorFormulaModalWrapper_fieldConnection"
    }
  ],
  "type": "fieldConnection",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = 'a39f542f4880d72208e3cf2acbec083c';

export default node;
