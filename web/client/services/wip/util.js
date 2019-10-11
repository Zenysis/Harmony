// @flow
// NOTE(stephen): These utilites aren't exactly AQT specific, I just don't have
// a good place for them right now.
import { API_VERSION_TO_PREFIX } from 'services/APIService';
import type { APIVersion } from 'services/APIService';
import type { URI } from 'services/types/api';

/**
 * Extract the model ID referenced by the URI.
 */
export function convertURIToID(
  uri: URI,
  apiVersion: APIVersion,
  endpoint: string,
): string {
  return uri.replace(`${API_VERSION_TO_PREFIX[apiVersion]}/${endpoint}/`, '');
}

/**
 * Convert the model ID into a valid URI.
 */
export function convertIDToURI(
  id: string,
  apiVersion: APIVersion,
  endpoint: string,
): URI {
  return `${API_VERSION_TO_PREFIX[apiVersion]}/${endpoint}/${id}`;
}
