/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
import type { FragmentReference } from "relay-runtime";
declare export opaque type CategoryInput_unpublishedField$ref: FragmentReference;
declare export opaque type CategoryInput_unpublishedField$fragmentType: CategoryInput_unpublishedField$ref;
export type CategoryInput_unpublishedField = {|
  +id: string,
  +unpublishedFieldCategoryMappings: $ReadOnlyArray<{|
    +category: {|
      +id: string,
      +name: string,
    |}
  |}>,
  +$refType: CategoryInput_unpublishedField$ref,
|};
export type CategoryInput_unpublishedField$data = CategoryInput_unpublishedField;
export type CategoryInput_unpublishedField$key = {
  +$data?: CategoryInput_unpublishedField$data,
  +$fragmentRefs: CategoryInput_unpublishedField$ref,
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
  "name": "CategoryInput_unpublishedField",
  "selections": [
    (v0/*: any*/),
    {
      "alias": "unpublishedFieldCategoryMappings",
      "args": null,
      "concreteType": "unpublished_field_category_mapping",
      "kind": "LinkedField",
      "name": "unpublished_field_category_mappings",
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
            (v0/*: any*/),
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
  "type": "unpublished_field",
  "abstractKey": null
};
})();
// prettier-ignore
(node/*: any*/).hash = '07a153150689b9fa0484cd8aba13828c';

export default node;
