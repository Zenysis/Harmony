/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
import type { FragmentReference } from "relay-runtime";
declare export opaque type DescriptionInput_unpublishedField$ref: FragmentReference;
declare export opaque type DescriptionInput_unpublishedField$fragmentType: DescriptionInput_unpublishedField$ref;
export type DescriptionInput_unpublishedField = {|
  +id: string,
  +description: ?string,
  +$refType: DescriptionInput_unpublishedField$ref,
|};
export type DescriptionInput_unpublishedField$data = DescriptionInput_unpublishedField;
export type DescriptionInput_unpublishedField$key = {
  +$data?: DescriptionInput_unpublishedField$data,
  +$fragmentRefs: DescriptionInput_unpublishedField$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "DescriptionInput_unpublishedField",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "id",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "description",
      "storageKey": null
    }
  ],
  "type": "unpublished_field",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = '38049bb727cc8976fe188af1c33470ba';

export default node;
