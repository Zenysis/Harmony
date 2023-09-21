/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
import type { FragmentReference } from "relay-runtime";
declare export opaque type ShortNameRow_field$ref: FragmentReference;
declare export opaque type ShortNameRow_field$fragmentType: ShortNameRow_field$ref;
export type ShortNameRow_field = {|
  +id: string,
  +shortName: string,
  +$refType: ShortNameRow_field$ref,
|};
export type ShortNameRow_field$data = ShortNameRow_field;
export type ShortNameRow_field$key = {
  +$data?: ShortNameRow_field$data,
  +$fragmentRefs: ShortNameRow_field$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "ShortNameRow_field",
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
  "type": "field",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = '3a3cead78eef839939f9616e99f2d036';

export default node;
