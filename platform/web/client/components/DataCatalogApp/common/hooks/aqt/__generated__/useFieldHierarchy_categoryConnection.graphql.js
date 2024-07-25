/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
import type { FragmentReference } from "relay-runtime";
declare export opaque type useFieldHierarchy_categoryConnection$ref: FragmentReference;
declare export opaque type useFieldHierarchy_categoryConnection$fragmentType: useFieldHierarchy_categoryConnection$ref;
export type useFieldHierarchy_categoryConnection = {|
  +edges: $ReadOnlyArray<{|
    +node: {|
      +id: string,
      +name: string,
      +parent: ?{|
        +id: string
      |},
      +visibilityStatus: any,
    |}
  |}>,
  +$refType: useFieldHierarchy_categoryConnection$ref,
|};
export type useFieldHierarchy_categoryConnection$data = useFieldHierarchy_categoryConnection;
export type useFieldHierarchy_categoryConnection$key = {
  +$data?: useFieldHierarchy_categoryConnection$data,
  +$fragmentRefs: useFieldHierarchy_categoryConnection$ref,
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
  "name": "useFieldHierarchy_categoryConnection",
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
            },
            {
              "alias": "visibilityStatus",
              "args": null,
              "kind": "ScalarField",
              "name": "visibility_status",
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
(node/*: any*/).hash = 'dd8fbe928f583554962253e0bcaa2ab3';

export default node;
