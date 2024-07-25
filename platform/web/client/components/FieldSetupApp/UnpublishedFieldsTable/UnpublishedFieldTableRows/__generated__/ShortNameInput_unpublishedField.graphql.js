/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
import type { FragmentReference } from "relay-runtime";
declare export opaque type ShortNameInput_unpublishedField$ref: FragmentReference;
declare export opaque type ShortNameInput_unpublishedField$fragmentType: ShortNameInput_unpublishedField$ref;
export type ShortNameInput_unpublishedField = {|
  +id: string,
  +shortName: ?string,
  +$refType: ShortNameInput_unpublishedField$ref,
|};
export type ShortNameInput_unpublishedField$data = ShortNameInput_unpublishedField;
export type ShortNameInput_unpublishedField$key = {
  +$data?: ShortNameInput_unpublishedField$data,
  +$fragmentRefs: ShortNameInput_unpublishedField$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "ShortNameInput_unpublishedField",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "id",
      "storageKey": null
    },
    {
      "alias": "shortName",
      "args": null,
      "kind": "ScalarField",
      "name": "short_name",
      "storageKey": null
    }
  ],
  "type": "unpublished_field",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = '2a0c0676a582a585ec7bec7b5ffb9f26';

export default node;
