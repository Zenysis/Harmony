/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type CalculationRow_field$ref = any;
type CategoryRow_field$ref = any;
type DatasourceRow_field$ref = any;
type DescriptionRow_field$ref = any;
type FieldIdRow_field$ref = any;
type NameRow_field$ref = any;
type ShortNameRow_field$ref = any;
type VisibilityRow_field$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type FieldDetailsSection_field$ref: FragmentReference;
declare export opaque type FieldDetailsSection_field$fragmentType: FieldDetailsSection_field$ref;
export type FieldDetailsSection_field = {|
  +$fragmentRefs: CalculationRow_field$ref & CategoryRow_field$ref & DatasourceRow_field$ref & DescriptionRow_field$ref & NameRow_field$ref & VisibilityRow_field$ref & ShortNameRow_field$ref & FieldIdRow_field$ref,
  +$refType: FieldDetailsSection_field$ref,
|};
export type FieldDetailsSection_field$data = FieldDetailsSection_field;
export type FieldDetailsSection_field$key = {
  +$data?: FieldDetailsSection_field$data,
  +$fragmentRefs: FieldDetailsSection_field$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "FieldDetailsSection_field",
  "selections": [
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "CalculationRow_field"
    },
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "CategoryRow_field"
    },
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "DatasourceRow_field"
    },
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "DescriptionRow_field"
    },
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "NameRow_field"
    },
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "VisibilityRow_field"
    },
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "ShortNameRow_field"
    },
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "FieldIdRow_field"
    }
  ],
  "type": "field",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = '305790ed891a9e0739cab0d9c606db8e';

export default node;
