/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
import type { FragmentReference } from "relay-runtime";
declare export opaque type useFieldHierarchy_fieldConnection$ref: FragmentReference;
declare export opaque type useFieldHierarchy_fieldConnection$fragmentType: useFieldHierarchy_fieldConnection$ref;
export type useFieldHierarchy_fieldConnection = {|
  +edges: $ReadOnlyArray<{|
    +node: {|
      +id: string,
      +name: string,
      +serializedCalculation: any,
      +shortName: string,
      +fieldCategoryMappings: $ReadOnlyArray<{|
        +category: {|
          +id: string
        |},
        +visibilityStatus: any,
      |}>,
      +fieldDimensionMappings: $ReadOnlyArray<{|
        +dimension: {|
          +id: string
        |}
      |}>,
    |}
  |}>,
  +$refType: useFieldHierarchy_fieldConnection$ref,
|};
export type useFieldHierarchy_fieldConnection$data = useFieldHierarchy_fieldConnection;
export type useFieldHierarchy_fieldConnection$key = {
  +$data?: useFieldHierarchy_fieldConnection$data,
  +$fragmentRefs: useFieldHierarchy_fieldConnection$ref,
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
v1 = [
  (v0/*: any*/)
];
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "useFieldHierarchy_fieldConnection",
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
              "alias": "serializedCalculation",
              "args": null,
              "kind": "ScalarField",
              "name": "calculation",
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
                  "selections": (v1/*: any*/),
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
            },
            {
              "alias": "fieldDimensionMappings",
              "args": null,
              "concreteType": "field_dimension_mapping",
              "kind": "LinkedField",
              "name": "field_dimension_mappings",
              "plural": true,
              "selections": [
                {
                  "alias": null,
                  "args": null,
                  "concreteType": "dimension",
                  "kind": "LinkedField",
                  "name": "dimension",
                  "plural": false,
                  "selections": (v1/*: any*/),
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
(node/*: any*/).hash = 'c81ed295121c733d152e826ee1889bc1';

export default node;
