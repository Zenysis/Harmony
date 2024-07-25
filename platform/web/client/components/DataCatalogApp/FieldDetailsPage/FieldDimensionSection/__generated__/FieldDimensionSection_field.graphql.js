/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
import type { FragmentReference } from "relay-runtime";
declare export opaque type FieldDimensionSection_field$ref: FragmentReference;
declare export opaque type FieldDimensionSection_field$fragmentType: FieldDimensionSection_field$ref;
export type FieldDimensionSection_field = {|
  +fieldDimensionMappings: $ReadOnlyArray<{|
    +dimension: {|
      +id: string,
      +name: string,
      +description: ?string,
    |}
  |}>,
  +$refType: FieldDimensionSection_field$ref,
|};
export type FieldDimensionSection_field$data = FieldDimensionSection_field;
export type FieldDimensionSection_field$key = {
  +$data?: FieldDimensionSection_field$data,
  +$fragmentRefs: FieldDimensionSection_field$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "FieldDimensionSection_field",
  "selections": [
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
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "description",
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
(node/*: any*/).hash = '456dbe6006c2454e20fffcad42c92d90';

export default node;
