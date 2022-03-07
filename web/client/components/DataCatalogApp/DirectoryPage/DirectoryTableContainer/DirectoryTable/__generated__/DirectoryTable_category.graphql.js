/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type CategoryGroupRow_category$ref = any;
type FieldRow_field$ref = any;
type FieldRow_fieldCategoryMapping$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type DirectoryTable_category$ref: FragmentReference;
declare export opaque type DirectoryTable_category$fragmentType: DirectoryTable_category$ref;
export type DirectoryTable_category = {|
  +children: $ReadOnlyArray<{|
    +id: string,
    +name: string,
    +$fragmentRefs: CategoryGroupRow_category$ref,
  |}>,
  +fieldCategoryMappings: $ReadOnlyArray<{|
    +field: {|
      +id: string,
      +name: string,
      +$fragmentRefs: FieldRow_field$ref,
    |},
    +$fragmentRefs: FieldRow_fieldCategoryMapping$ref,
  |}>,
  +$refType: DirectoryTable_category$ref,
|};
export type DirectoryTable_category$data = DirectoryTable_category;
export type DirectoryTable_category$key = {
  +$data?: DirectoryTable_category$data,
  +$fragmentRefs: DirectoryTable_category$ref,
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
  "name": "DirectoryTable_category",
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "category",
      "kind": "LinkedField",
      "name": "children",
      "plural": true,
      "selections": [
        (v0/*: any*/),
        (v1/*: any*/),
        {
          "args": null,
          "kind": "FragmentSpread",
          "name": "CategoryGroupRow_category"
        }
      ],
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
          "concreteType": "field",
          "kind": "LinkedField",
          "name": "field",
          "plural": false,
          "selections": [
            (v0/*: any*/),
            (v1/*: any*/),
            {
              "args": null,
              "kind": "FragmentSpread",
              "name": "FieldRow_field"
            }
          ],
          "storageKey": null
        },
        {
          "args": null,
          "kind": "FragmentSpread",
          "name": "FieldRow_fieldCategoryMapping"
        }
      ],
      "storageKey": null
    }
  ],
  "type": "category",
  "abstractKey": null
};
})();
// prettier-ignore
(node/*: any*/).hash = '46a07948dfdddd8cd041d9b66de9cb6c';

export default node;
