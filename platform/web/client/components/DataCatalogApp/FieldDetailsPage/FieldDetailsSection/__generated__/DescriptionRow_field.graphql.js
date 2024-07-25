/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
import type { FragmentReference } from "relay-runtime";
declare export opaque type DescriptionRow_field$ref: FragmentReference;
declare export opaque type DescriptionRow_field$fragmentType: DescriptionRow_field$ref;
export type DescriptionRow_field = {|
  +description: ?string,
  +id: string,
  +$refType: DescriptionRow_field$ref,
|};
export type DescriptionRow_field$data = DescriptionRow_field;
export type DescriptionRow_field$key = {
  +$data?: DescriptionRow_field$data,
  +$fragmentRefs: DescriptionRow_field$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "DescriptionRow_field",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "description",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "id",
      "storageKey": null
    }
  ],
  "type": "field",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = 'f7c3d69fe6b71a53eaaa9c0d983e5959';

export default node;
