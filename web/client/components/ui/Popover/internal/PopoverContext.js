// @flow
import * as React from 'react';

type PopoverState = {
  parentElt: HTMLElement | string | void,
};

const defaultPopoverState = {
  parentElt: undefined,
};

export const PopoverContext: React.Context<PopoverState> = React.createContext(
  defaultPopoverState,
);
