/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type useFieldCalculation_field$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type FieldIdRow_field$ref: FragmentReference;
declare export opaque type FieldIdRow_field$fragmentType: FieldIdRow_field$ref;
export type FieldIdRow_field = {|
  +id: string,
  +$fragmentRefs: useFieldCalculation_field$ref,
  +$refType: FieldIdRow_field$ref,
|};
export type FieldIdRow_field$data = FieldIdRow_field;
export type FieldIdRow_field$key = {
  +$data?: FieldIdRow_field$data,
  +$fragmentRefs: FieldIdRow_field$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "FieldIdRow_field",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "id",
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
(node/*: any*/).hash = '66d3388903bda118857cafa6ff7e58ca';

export default node;
