/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
import type { FragmentReference } from "relay-runtime";
declare export opaque type EditableCategoryValue_field$ref: FragmentReference;
declare export opaque type EditableCategoryValue_field$fragmentType: EditableCategoryValue_field$ref;
export type EditableCategoryValue_field = {|
  +fieldCategoryMappings: $ReadOnlyArray<{|
    +category: {|
      +id: string,
      +name: string,
    |}
  |}>,
  +$refType: EditableCategoryValue_field$ref,
|};
export type EditableCategoryValue_field$data = EditableCategoryValue_field;
export type EditableCategoryValue_field$key = {
  +$data?: EditableCategoryValue_field$data,
  +$fragmentRefs: EditableCategoryValue_field$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "EditableCategoryValue_field",
  "selections": [
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
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "id",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "name",
              "storageKey": null
            }
          ],
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "field",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = '71f9b0a610d6ba405bc6837e21c2fbdc';

export default node;
