/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type useFilterHierarchy_fieldConnection$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type CategoryRow_fieldConnection$ref: FragmentReference;
declare export opaque type CategoryRow_fieldConnection$fragmentType: CategoryRow_fieldConnection$ref;
export type CategoryRow_fieldConnection = {|
  +$fragmentRefs: useFilterHierarchy_fieldConnection$ref,
  +$refType: CategoryRow_fieldConnection$ref,
|};
export type CategoryRow_fieldConnection$data = CategoryRow_fieldConnection;
export type CategoryRow_fieldConnection$key = {
  +$data?: CategoryRow_fieldConnection$data,
  +$fragmentRefs: CategoryRow_fieldConnection$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "CategoryRow_fieldConnection",
  "selections": [
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "useFilterHierarchy_fieldConnection"
    }
  ],
  "type": "fieldConnection",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = 'ba31a8199878169a56c553b561412a11';

export default node;
