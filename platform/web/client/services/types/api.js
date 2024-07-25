// @flow

// These types are commonly used with API services.

export type URI = string;

// A json-ref attribute that links a backend model to another backend model
// based on an ID.
export type JSONRef = {
  $ref: URI,
};

/**
 * The URIConverter interface indicates an implementing class can translate a
 * URI reference into an ID, and can convert an ID into a URI reference.
 */
export interface URIConverter {
  convertIDToURI(id: string): string;
  convertURIToID(uri: URI): string;
}
