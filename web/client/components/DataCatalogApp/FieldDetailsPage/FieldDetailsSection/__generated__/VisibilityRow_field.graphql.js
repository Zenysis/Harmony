/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
import type { FragmentReference } from "relay-runtime";
declare export opaque type VisibilityRow_field$ref: FragmentReference;
declare export opaque type VisibilityRow_field$fragmentType: VisibilityRow_field$ref;
export type VisibilityRow_field = {|
  +fieldCategoryMappings: $ReadOnlyArray<{|
    +categoryId: string,
    +fieldId: string,
    +visibilityStatus: any,
  |}>,
  +$refType: VisibilityRow_field$ref,
|};
export type VisibilityRow_field$data = VisibilityRow_field;
export type VisibilityRow_field$key = {
  +$data?: VisibilityRow_field$data,
  +$fragmentRefs: VisibilityRow_field$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "VisibilityRow_field",
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
          "alias": "categoryId",
          "args": null,
          "kind": "ScalarField",
          "name": "category_id",
          "storageKey": null
        },
        {
          "alias": "fieldId",
          "args": null,
          "kind": "ScalarField",
          "name": "field_id",
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
  "type": "field",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = '60f26e3791983dd65aff51b5ef1ad53b';

export default node;
