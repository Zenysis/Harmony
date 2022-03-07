/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type useFieldCalculation_field$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type CopyIndicatorView_field$ref: FragmentReference;
declare export opaque type CopyIndicatorView_field$fragmentType: CopyIndicatorView_field$ref;
export type CopyIndicatorView_field = {|
  +name: string,
  +$fragmentRefs: useFieldCalculation_field$ref,
  +$refType: CopyIndicatorView_field$ref,
|};
export type CopyIndicatorView_field$data = CopyIndicatorView_field;
export type CopyIndicatorView_field$key = {
  +$data?: CopyIndicatorView_field$data,
  +$fragmentRefs: CopyIndicatorView_field$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "CopyIndicatorView_field",
  "selections": [
    {
      "alias": null,
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
(node/*: any*/).hash = 'fceedf2a05d5729c3478305ae9aca948';

export default node;
