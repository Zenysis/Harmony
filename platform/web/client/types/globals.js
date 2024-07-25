// @flow
/**
 * Flow global declarations.
 * These declarations (variables, functions, and types) will be automatically
 * included by flow without needing to import.
 */
// Global variables
declare var __DEV__: boolean; // webpack global variable

// Global types
declare type $RefObject<RefValueType> = {
  current: RefValueType | null,
  ...
};

declare type $ElementRefObject<ElementType: React$ElementType> = $RefObject<
  React$ElementRef<ElementType>,
>;

declare type $CallbackRef<RefValueType> = (null | RefValueType) => mixed;

declare type $Ref<RefValueType> =
  | $RefObject<RefValueType>
  | $CallbackRef<RefValueType>;

// Helper type to get the Context type of a Context object that was
// created through React.createContext
declare type $ContextType<T: React$Context<any>> = $Call<
  <C>(React$Context<C>) => C,
  T,
>;

declare type $Dispatch<Action> = (action: Action) => void;

declare var graphql: any;
