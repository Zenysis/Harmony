/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type EditableCategoryValue_field$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type CategoryRow_field$ref: FragmentReference;
declare export opaque type CategoryRow_field$fragmentType: CategoryRow_field$ref;
export type CategoryRow_field = {|
  +id: string,
  +$fragmentRefs: EditableCategoryValue_field$ref,
  +$refType: CategoryRow_field$ref,
|};
export type CategoryRow_field$data = CategoryRow_field;
export type CategoryRow_field$key = {
  +$data?: CategoryRow_field$data,
  +$fragmentRefs: CategoryRow_field$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "CategoryRow_field",
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
      "name": "EditableCategoryValue_field"
    }
  ],
  "type": "field",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = '1aed95accf2be3725c633aefdd2ea8df';

export default node;
