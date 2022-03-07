/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type CategoryRow_fieldConnection$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type FieldDetailsSection_fieldConnection$ref: FragmentReference;
declare export opaque type FieldDetailsSection_fieldConnection$fragmentType: FieldDetailsSection_fieldConnection$ref;
export type FieldDetailsSection_fieldConnection = {|
  +$fragmentRefs: CategoryRow_fieldConnection$ref,
  +$refType: FieldDetailsSection_fieldConnection$ref,
|};
export type FieldDetailsSection_fieldConnection$data = FieldDetailsSection_fieldConnection;
export type FieldDetailsSection_fieldConnection$key = {
  +$data?: FieldDetailsSection_fieldConnection$data,
  +$fragmentRefs: FieldDetailsSection_fieldConnection$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "FieldDetailsSection_fieldConnection",
  "selections": [
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "CategoryRow_fieldConnection"
    }
  ],
  "type": "fieldConnection",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = 'e0acf2299f49fae02231cd721a2d4f42';

export default node;
