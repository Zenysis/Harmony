/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
import type { FragmentReference } from "relay-runtime";
declare export opaque type FieldRow_fieldCategoryMapping$ref: FragmentReference;
declare export opaque type FieldRow_fieldCategoryMapping$fragmentType: FieldRow_fieldCategoryMapping$ref;
export type FieldRow_fieldCategoryMapping = {|
  +visibilityStatus: any,
  +$refType: FieldRow_fieldCategoryMapping$ref,
|};
export type FieldRow_fieldCategoryMapping$data = FieldRow_fieldCategoryMapping;
export type FieldRow_fieldCategoryMapping$key = {
  +$data?: FieldRow_fieldCategoryMapping$data,
  +$fragmentRefs: FieldRow_fieldCategoryMapping$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "FieldRow_fieldCategoryMapping",
  "selections": [
    {
      "alias": "visibilityStatus",
      "args": null,
      "kind": "ScalarField",
      "name": "visibility_status",
      "storageKey": null
    }
  ],
  "type": "field_category_mapping",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = '3d08c90ca39f293ca5d0a666b0b9e3f7';

export default node;
