// @flow

// Declare Bluebird's promise type as the default Promise.
import type Promise from 'bluebird'; // eslint-disable-line no-unused-vars

/**
 * Flow global declarations.
 * These declarations (variables, functions, and types) will be automatically
 * included by flow without needing to import.
 */

// Global variables
declare var __DEV__: boolean; // webpack global variable

declare var analytics: {
  track(
    event_name: string,
    properties?: Object,
    options?: Object,
    callback?: Function,
  ): void,
};

// Global functions
declare function t(path: string, interpolationObj?: { [string]: any }): *;

// Global types

// $Prop extracts the type of any prop from a React component's props definition
// NOTE(pablo): this only works with React Class components. It does not work
// with stateless functional components.
/**
 * @deprecated
 * This type should not be used anymore. It is preferable to explicitly state
 * a prop type. If you're duplicating types too much, this is a good indication
 * that you should use the context API to share props down a long chain.
 */
declare type $Prop<T: React$Component<any, any>, PropName> = $ElementType<
  $PropertyType<T, 'props'>,
  PropName,
>;

declare type $RefObject<ElementType: React$ElementType> = {
  current: null | React$ElementRef<ElementType>,
};

// Private helper type to extract the context type form a context Provider
type _ExtractContextType = <T>(
  React$ComponentType<{ value: T, children?: ?React$Node }>,
) => T;

// Helper type to get the Context type of a Context object that was
// created through React.createContext
declare type $ContextType<T: React$Context<any>> = $Call<
  _ExtractContextType,
  $PropertyType<T, 'Provider'>,
>;

// $Merge<A, B> merges two object types together.
// This is slightly different from doing A & B in that it does not intersect the
// types, but rather creates a whole new object. This allows B to overwrite
// types from A, which would not be possible with the intersection operator.
// (Also, Flow's type inference on passThroughProps that use intersection types
// isn't great, and it sometimes makes the wrong guess of what type to infer.
// In those cases, you'll find that using $Merge is actually better)
declare type $Merge<A: Object, B: Object> = { ...$Exact<A>, ...$Exact<B> };
