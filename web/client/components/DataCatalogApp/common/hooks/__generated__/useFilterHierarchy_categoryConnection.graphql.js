/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
import type { FragmentReference } from "relay-runtime";
declare export opaque type useFilterHierarchy_categoryConnection$ref: FragmentReference;
declare export opaque type useFilterHierarchy_categoryConnection$fragmentType: useFilterHierarchy_categoryConnection$ref;
export type useFilterHierarchy_categoryConnection = {|
  +edges: $ReadOnlyArray<{|
    +node: {|
      +id: string,
      +name: string,
      +parent: ?{|
        +id: string
      |},
    |}
  |}>,
  +$refType: useFilterHierarchy_categoryConnection$ref,
|};
export type useFilterHierarchy_categoryConnection$data = useFilterHierarchy_categoryConnection;
export type useFilterHierarchy_categoryConnection$key = {
  +$data?: useFilterHierarchy_categoryConnection$data,
  +$fragmentRefs: useFilterHierarchy_categoryConnection$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
};
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "useFilterHierarchy_categoryConnection",
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "categoryEdge",
      "kind": "LinkedField",
      "name": "edges",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "category",
          "kind": "LinkedField",
          "name": "node",
          "plural": false,
          "selections": [
            (v0/*: any*/),
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "name",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "concreteType": "category",
              "kind": "LinkedField",
              "name": "parent",
              "plural": false,
              "selections": [
                (v0/*: any*/)
              ],
              "storageKey": null
            }
          ],
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "categoryConnection",
  "abstractKey": null
};
})();
// prettier-ignore
(node/*: any*/).hash = '46bcc1e5c8859889c35eaae30aee5745';

export default node;
