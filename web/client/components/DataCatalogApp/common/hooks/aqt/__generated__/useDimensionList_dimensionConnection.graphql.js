/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
import type { FragmentReference } from "relay-runtime";
declare export opaque type useDimensionList_dimensionConnection$ref: FragmentReference;
declare export opaque type useDimensionList_dimensionConnection$fragmentType: useDimensionList_dimensionConnection$ref;
export type useDimensionList_dimensionConnection = {|
  +edges: $ReadOnlyArray<{|
    +node: {|
      +id: string,
      +name: string,
      +dimensionCategoryMappings: $ReadOnlyArray<{|
        +category: {|
          +name: string,
          +id: string,
        |}
      |}>,
    |}
  |}>,
  +$refType: useDimensionList_dimensionConnection$ref,
|};
export type useDimensionList_dimensionConnection$data = useDimensionList_dimensionConnection;
export type useDimensionList_dimensionConnection$key = {
  +$data?: useDimensionList_dimensionConnection$data,
  +$fragmentRefs: useDimensionList_dimensionConnection$ref,
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
  "name": "useDimensionList_dimensionConnection",
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
                    (v1/*: any*/),
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
      "storageKey": null
    }
  ],
  "type": "dimensionConnection",
  "abstractKey": null
};
})();
// prettier-ignore
(node/*: any*/).hash = '14ee1ef3573808df4a95063caa6bc695';

export default node;
