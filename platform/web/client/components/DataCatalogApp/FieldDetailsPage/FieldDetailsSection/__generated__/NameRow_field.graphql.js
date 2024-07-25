/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
import type { FragmentReference } from "relay-runtime";
declare export opaque type NameRow_field$ref: FragmentReference;
declare export opaque type NameRow_field$fragmentType: NameRow_field$ref;
export type NameRow_field = {|
  +id: string,
  +name: string,
  +$refType: NameRow_field$ref,
|};
export type NameRow_field$data = NameRow_field;
export type NameRow_field$key = {
  +$data?: NameRow_field$data,
  +$fragmentRefs: NameRow_field$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "NameRow_field",
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
  "type": "field",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = 'e49ece6cf65002b034297c666b9453c0';

export default node;
