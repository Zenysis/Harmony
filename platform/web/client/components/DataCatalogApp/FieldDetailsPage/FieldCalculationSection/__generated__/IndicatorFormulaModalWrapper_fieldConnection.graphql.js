/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type IndicatorFormulaModal_fieldConnection$ref = any;
type useFilterHierarchy_fieldConnection$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type IndicatorFormulaModalWrapper_fieldConnection$ref: FragmentReference;
declare export opaque type IndicatorFormulaModalWrapper_fieldConnection$fragmentType: IndicatorFormulaModalWrapper_fieldConnection$ref;
export type IndicatorFormulaModalWrapper_fieldConnection = {|
  +$fragmentRefs: useFilterHierarchy_fieldConnection$ref & IndicatorFormulaModal_fieldConnection$ref,
  +$refType: IndicatorFormulaModalWrapper_fieldConnection$ref,
|};
export type IndicatorFormulaModalWrapper_fieldConnection$data = IndicatorFormulaModalWrapper_fieldConnection;
export type IndicatorFormulaModalWrapper_fieldConnection$key = {
  +$data?: IndicatorFormulaModalWrapper_fieldConnection$data,
  +$fragmentRefs: IndicatorFormulaModalWrapper_fieldConnection$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "IndicatorFormulaModalWrapper_fieldConnection",
  "selections": [
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "useFilterHierarchy_fieldConnection"
    },
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "IndicatorFormulaModal_fieldConnection"
    }
  ],
  "type": "fieldConnection",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = '64a79b64c5301c92388044e6b504a2ad';

export default node;
