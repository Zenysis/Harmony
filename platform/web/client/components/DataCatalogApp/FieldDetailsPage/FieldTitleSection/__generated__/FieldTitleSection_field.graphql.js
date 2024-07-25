/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type useFieldCalculation_field$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type FieldTitleSection_field$ref: FragmentReference;
declare export opaque type FieldTitleSection_field$fragmentType: FieldTitleSection_field$ref;
export type FieldTitleSection_field = {|
  +id: string,
  +name: string,
  +copiedFromFieldId: ?string,
  +$fragmentRefs: useFieldCalculation_field$ref,
  +$refType: FieldTitleSection_field$ref,
|};
export type FieldTitleSection_field$data = FieldTitleSection_field;
export type FieldTitleSection_field$key = {
  +$data?: FieldTitleSection_field$data,
  +$fragmentRefs: FieldTitleSection_field$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "FieldTitleSection_field",
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
      "alias": "copiedFromFieldId",
      "args": null,
      "kind": "ScalarField",
      "name": "copied_from_field_id",
      "storageKey": null
    },
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "useFieldCalculation_field"
    }
  ],
  "type": "field",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = '1d4b861852ceeca38af0dadd2af4b922';

export default node;
