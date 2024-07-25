/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type IndicatorFormulaModal_fieldConnection$ref = any;
type useFieldHierarchy_fieldConnection$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type EditCalculationView_fieldConnection$ref: FragmentReference;
declare export opaque type EditCalculationView_fieldConnection$fragmentType: EditCalculationView_fieldConnection$ref;
export type EditCalculationView_fieldConnection = {|
  +$fragmentRefs: IndicatorFormulaModal_fieldConnection$ref & useFieldHierarchy_fieldConnection$ref,
  +$refType: EditCalculationView_fieldConnection$ref,
|};
export type EditCalculationView_fieldConnection$data = EditCalculationView_fieldConnection;
export type EditCalculationView_fieldConnection$key = {
  +$data?: EditCalculationView_fieldConnection$data,
  +$fragmentRefs: EditCalculationView_fieldConnection$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "EditCalculationView_fieldConnection",
  "selections": [
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "IndicatorFormulaModal_fieldConnection"
    },
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "useFieldHierarchy_fieldConnection"
    }
  ],
  "type": "fieldConnection",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = '5077625fd47b8d7f5a3f66662d916008';

export default node;
