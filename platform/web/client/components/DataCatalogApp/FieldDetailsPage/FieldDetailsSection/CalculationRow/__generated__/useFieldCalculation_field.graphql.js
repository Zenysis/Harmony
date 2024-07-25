/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
import type { FragmentReference } from "relay-runtime";
declare export opaque type useFieldCalculation_field$ref: FragmentReference;
declare export opaque type useFieldCalculation_field$fragmentType: useFieldCalculation_field$ref;
export type useFieldCalculation_field = {|
  +serializedCalculation: any,
  +$refType: useFieldCalculation_field$ref,
|};
export type useFieldCalculation_field$data = useFieldCalculation_field;
export type useFieldCalculation_field$key = {
  +$data?: useFieldCalculation_field$data,
  +$fragmentRefs: useFieldCalculation_field$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "useFieldCalculation_field",
  "selections": [
    {
      "alias": "serializedCalculation",
      "args": null,
      "kind": "ScalarField",
      "name": "calculation",
      "storageKey": null
    }
  ],
  "type": "field",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = 'a0b7692eca920b4132cd872e915124d5';

export default node;
