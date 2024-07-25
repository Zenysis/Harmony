/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type useUnpublishedFieldCalculation_unpublishedField$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type CalculationInput_unpublishedField$ref: FragmentReference;
declare export opaque type CalculationInput_unpublishedField$fragmentType: CalculationInput_unpublishedField$ref;
export type CalculationInput_unpublishedField = {|
  +id: string,
  +$fragmentRefs: useUnpublishedFieldCalculation_unpublishedField$ref,
  +$refType: CalculationInput_unpublishedField$ref,
|};
export type CalculationInput_unpublishedField$data = CalculationInput_unpublishedField;
export type CalculationInput_unpublishedField$key = {
  +$data?: CalculationInput_unpublishedField$data,
  +$fragmentRefs: CalculationInput_unpublishedField$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "CalculationInput_unpublishedField",
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
      "name": "useUnpublishedFieldCalculation_unpublishedField"
    }
  ],
  "type": "unpublished_field",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = 'dc7b4ff1bf3bdf829203f9aac34f951f';

export default node;
