// @flow
// eslint-disable-next-line import/extensions
import { VENDOR_SCRIPT_PATH } from 'backend_config.js';
import type DependentVendorScript from 'vendor/models/DependentVendorScript';
import type VendorScript from 'vendor/models/VendorScript';

export function buildVendorScript(
  vendorScript: VendorScript | DependentVendorScript,
): string {
  return `${VENDOR_SCRIPT_PATH}${vendorScript._.scriptFile()}`;
}
