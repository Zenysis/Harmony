/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type useFieldHierarchy_categoryConnection$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type EditCalculationView_categoryConnection$ref: FragmentReference;
declare export opaque type EditCalculationView_categoryConnection$fragmentType: EditCalculationView_categoryConnection$ref;
export type EditCalculationView_categoryConnection = {|
  +$fragmentRefs: useFieldHierarchy_categoryConnection$ref,
  +$refType: EditCalculationView_categoryConnection$ref,
|};
export type EditCalculationView_categoryConnection$data = EditCalculationView_categoryConnection;
export type EditCalculationView_categoryConnection$key = {
  +$data?: EditCalculationView_categoryConnection$data,
  +$fragmentRefs: EditCalculationView_categoryConnection$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "EditCalculationView_categoryConnection",
  "selections": [
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "useFieldHierarchy_categoryConnection"
    }
  ],
  "type": "categoryConnection",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = '26de7188c4bbdcf2a72e72e67f17c17a';

export default node;
