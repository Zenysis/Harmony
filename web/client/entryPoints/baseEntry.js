// @flow
import 'translate';
import Navbar from 'components/Navbar';
import { monitorSessionTimeout } from 'util/timeoutSession';

// For class components
// TODO when all App components have been converted to functional
// components, delete renderEntry functions (keeping only
// executeRenderEntry functions).
export const renderEntry = (component: any) => {
  Navbar.renderToDOM();
  component.renderToDOM();
  monitorSessionTimeout();
};

export const renderEntryWithoutNavbar = (component: any) => {
  component.renderToDOM();
  monitorSessionTimeout();
};

// For functional components
export const executeRenderEntry = (renderFunc: () => void) => {
  Navbar.renderToDOM();
  renderFunc();
  monitorSessionTimeout();
};

export const executeRenderEntryWithoutNavbar = (renderFunc: () => void) => {
  renderFunc();
  monitorSessionTimeout();
};

export const renderUnAuthenticatedEntry = (renderFunc: () => void) => {
  Navbar.renderToDOM();
  renderFunc();
};
