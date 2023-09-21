/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
import type { FragmentReference } from "relay-runtime";
declare export opaque type useGroupingHierarchy_dimensionConnection$ref: FragmentReference;
declare export opaque type useGroupingHierarchy_dimensionConnection$fragmentType: useGroupingHierarchy_dimensionConnection$ref;
export type useGroupingHierarchy_dimensionConnection = {|
  +edges: $ReadOnlyArray<{|
    +node: {|
      +id: string,
      +name: string,
      +dimensionCategoryMappings: $ReadOnlyArray<{|
        +category: {|
          +id: string,
          +name: string,
        |}
      |}>,
    |}
  |}>,
  +$refType: useGroupingHierarchy_dimensionConnection$ref,
|};
export type useGroupingHierarchy_dimensionConnection$data = useGroupingHierarchy_dimensionConnection;
export type useGroupingHierarchy_dimensionConnection$key = {
  +$data?: useGroupingHierarchy_dimensionConnection$data,
  +$fragmentRefs: useGroupingHierarchy_dimensionConnection$ref,
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
},
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
};
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "useGroupingHierarchy_dimensionConnection",
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "dimensionEdge",
      "kind": "LinkedField",
      "name": "edges",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "dimension",
          "kind": "LinkedField",
          "name": "node",
          "plural": false,
          "selections": [
            (v0/*: any*/),
            (v1/*: any*/),
            {
              "alias": "dimensionCategoryMappings",
              "args": null,
              "concreteType": "dimension_category_mapping",
              "kind": "LinkedField",
              "name": "dimension_category_mappings",
              "plural": true,
              "selections": [
                {
                  "alias": "category",
                  "args": null,
                  "concreteType": "dimension_category",
                  "kind": "LinkedField",
                  "name": "dimension_category",
                  "plural": false,
                  "selections": [
                    (v0/*: any*/),
                    (v1/*: any*/)
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
      "storageKey": null
    }
  ],
  "type": "dimensionConnection",
  "abstractKey": null
};
})();
// prettier-ignore
(node/*: any*/).hash = 'ce3a27650db225844764043eb36ffc99';

export default node;
