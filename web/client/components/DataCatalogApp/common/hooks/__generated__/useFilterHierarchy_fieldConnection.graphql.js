/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
import type { FragmentReference } from "relay-runtime";
declare export opaque type useFilterHierarchy_fieldConnection$ref: FragmentReference;
declare export opaque type useFilterHierarchy_fieldConnection$fragmentType: useFilterHierarchy_fieldConnection$ref;
export type useFilterHierarchy_fieldConnection = {|
  +edges: $ReadOnlyArray<{|
    +node: {|
      +id: string,
      +name: string,
      +shortName: string,
      +fieldCategoryMappings: $ReadOnlyArray<{|
        +category: {|
          +id: string
        |}
      |}>,
    |}
  |}>,
  +$refType: useFilterHierarchy_fieldConnection$ref,
|};
export type useFilterHierarchy_fieldConnection$data = useFilterHierarchy_fieldConnection;
export type useFilterHierarchy_fieldConnection$key = {
  +$data?: useFilterHierarchy_fieldConnection$data,
  +$fragmentRefs: useFilterHierarchy_fieldConnection$ref,
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
  "name": "useFilterHierarchy_fieldConnection",
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "fieldEdge",
      "kind": "LinkedField",
      "name": "edges",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "field",
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
              "alias": "shortName",
              "args": null,
              "kind": "ScalarField",
              "name": "short_name",
              "storageKey": null
            },
            {
              "alias": "fieldCategoryMappings",
              "args": null,
              "concreteType": "field_category_mapping",
              "kind": "LinkedField",
              "name": "field_category_mappings",
              "plural": true,
              "selections": [
                {
                  "alias": null,
                  "args": null,
                  "concreteType": "category",
                  "kind": "LinkedField",
                  "name": "category",
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
      "storageKey": null
    }
  ],
  "type": "fieldConnection",
  "abstractKey": null
};
})();
// prettier-ignore
(node/*: any*/).hash = '6fc2cb443025420cb1ef4223bd23c736';

export default node;
