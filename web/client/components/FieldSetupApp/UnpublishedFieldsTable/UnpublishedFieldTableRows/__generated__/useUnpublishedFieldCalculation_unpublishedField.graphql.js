/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
import type { FragmentReference } from "relay-runtime";
declare export opaque type useUnpublishedFieldCalculation_unpublishedField$ref: FragmentReference;
declare export opaque type useUnpublishedFieldCalculation_unpublishedField$fragmentType: useUnpublishedFieldCalculation_unpublishedField$ref;
export type useUnpublishedFieldCalculation_unpublishedField = {|
  +serializedCalculation: ?any,
  +$refType: useUnpublishedFieldCalculation_unpublishedField$ref,
|};
export type useUnpublishedFieldCalculation_unpublishedField$data = useUnpublishedFieldCalculation_unpublishedField;
export type useUnpublishedFieldCalculation_unpublishedField$key = {
  +$data?: useUnpublishedFieldCalculation_unpublishedField$data,
  +$fragmentRefs: useUnpublishedFieldCalculation_unpublishedField$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "useUnpublishedFieldCalculation_unpublishedField",
  "selections": [
    {
      "alias": "serializedCalculation",
      "args": null,
      "kind": "ScalarField",
      "name": "calculation",
      "storageKey": null
    }
  ],
  "type": "unpublished_field",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = '16901e503eba0bb4c4044aedb10e56ef';

export default node;
