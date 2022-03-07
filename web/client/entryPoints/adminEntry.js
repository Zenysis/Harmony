// @flow
import AdminApp from 'components/AdminApp';
import Navbar from 'components/Navbar';
import { monitorSessionTimeout } from 'util/timeoutSession';

Navbar.renderToDOM();
AdminApp.renderToDOM();

monitorSessionTimeout();
