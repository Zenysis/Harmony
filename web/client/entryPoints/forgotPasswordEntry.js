/* eslint-disable zen/zen-import-order */
// @flow
import { renderUnAuthenticatedEntry } from 'entryPoints/baseEntry';
import renderToDOM from 'components/Authentication/ForgotPassword';

renderUnAuthenticatedEntry(renderToDOM);