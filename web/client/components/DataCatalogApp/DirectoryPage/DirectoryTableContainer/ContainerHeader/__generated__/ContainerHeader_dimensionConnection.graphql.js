/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type CreateCalculationIndicatorView_dimensionConnection$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type ContainerHeader_dimensionConnection$ref: FragmentReference;
declare export opaque type ContainerHeader_dimensionConnection$fragmentType: ContainerHeader_dimensionConnection$ref;
export type ContainerHeader_dimensionConnection = {|
  +$fragmentRefs: CreateCalculationIndicatorView_dimensionConnection$ref,
  +$refType: ContainerHeader_dimensionConnection$ref,
|};
export type ContainerHeader_dimensionConnection$data = ContainerHeader_dimensionConnection;
export type ContainerHeader_dimensionConnection$key = {
  +$data?: ContainerHeader_dimensionConnection$data,
  +$fragmentRefs: ContainerHeader_dimensionConnection$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "ContainerHeader_dimensionConnection",
  "selections": [
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "CreateCalculationIndicatorView_dimensionConnection"
    }
  ],
  "type": "dimensionConnection",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = '67ce7d55aa03e7c8302aa96e7d1897f5';

export default node;
