/**
 * @flow
 */

/* eslint-disable */

'use strict';

/*::
import type { ReaderFragment } from 'relay-runtime';
type UpdateDatasourceAction_pipelineDatasourceConnection$ref = any;
import type { FragmentReference } from "relay-runtime";
declare export opaque type FieldSetupPageHeaderActions_pipelineDatasourceConnection$ref: FragmentReference;
declare export opaque type FieldSetupPageHeaderActions_pipelineDatasourceConnection$fragmentType: FieldSetupPageHeaderActions_pipelineDatasourceConnection$ref;
export type FieldSetupPageHeaderActions_pipelineDatasourceConnection = {|
  +$fragmentRefs: UpdateDatasourceAction_pipelineDatasourceConnection$ref,
  +$refType: FieldSetupPageHeaderActions_pipelineDatasourceConnection$ref,
|};
export type FieldSetupPageHeaderActions_pipelineDatasourceConnection$data = FieldSetupPageHeaderActions_pipelineDatasourceConnection;
export type FieldSetupPageHeaderActions_pipelineDatasourceConnection$key = {
  +$data?: FieldSetupPageHeaderActions_pipelineDatasourceConnection$data,
  +$fragmentRefs: FieldSetupPageHeaderActions_pipelineDatasourceConnection$ref,
  ...
};
*/


const node/*: ReaderFragment*/ = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "FieldSetupPageHeaderActions_pipelineDatasourceConnection",
  "selections": [
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "UpdateDatasourceAction_pipelineDatasourceConnection"
    }
  ],
  "type": "pipeline_datasourceConnection",
  "abstractKey": null
};
// prettier-ignore
(node/*: any*/).hash = 'eecfbd068612cc3c11c09a97c52d6bb0';

export default node;
