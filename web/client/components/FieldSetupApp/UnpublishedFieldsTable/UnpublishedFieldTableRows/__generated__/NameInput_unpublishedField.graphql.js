/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
import type { FragmentReference } from "relay-runtime";
declare export opaque type NameInput_unpublishedField$ref: FragmentReference;
declare export opaque type NameInput_unpublishedField$fragmentType: NameInput_unpublishedField$ref;
export type NameInput_unpublishedField = {|
  +id: string,
  +name: ?string,
  +$refType: NameInput_unpublishedField$ref,
|};
export type NameInput_unpublishedField$data = NameInput_unpublishedField;
export type NameInput_unpublishedField$key = {
  +$data?: NameInput_unpublishedField$data,
  +$fragmentRefs: NameInput_unpublishedField$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "NameInput_unpublishedField",
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
      "name": "name",
      "storageKey": null
    }
  ],
  "type": "unpublished_field",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = '48f01fc62031a19df11b9486e61218b4';

export default node;
