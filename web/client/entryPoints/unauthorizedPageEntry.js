// @flow
import Navbar from 'components/Navbar';
import UnauthorizedPage from 'components/UnauthorizedPage';
import { monitorSessionTimeout } from 'util/timeoutSession';

Navbar.renderToDOM();
UnauthorizedPage.renderToDOM();

monitorSessionTimeout();
