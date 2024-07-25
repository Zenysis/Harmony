/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
import type { FragmentReference } from "relay-runtime";
declare export opaque type FieldProfilingSection_field$ref: FragmentReference;
declare export opaque type FieldProfilingSection_field$fragmentType: FieldProfilingSection_field$ref;
export type FieldProfilingSection_field = {|
  +name: string,
  +shortName: string,
  +serializedCalculation: any,
  +$refType: FieldProfilingSection_field$ref,
|};
export type FieldProfilingSection_field$data = FieldProfilingSection_field;
export type FieldProfilingSection_field$key = {
  +$data?: FieldProfilingSection_field$data,
  +$fragmentRefs: FieldProfilingSection_field$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "FieldProfilingSection_field",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "name",
      "storageKey": null
    },
    {
      "alias": "shortName",
      "args": null,
      "kind": "ScalarField",
      "name": "short_name",
      "storageKey": null
    },
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
(node/*: any*/).hash = '79de1f9f78ab7fc16b1f17b2326877f6';

export default node;
