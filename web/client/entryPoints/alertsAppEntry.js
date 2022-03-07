// @flow
import AlertsApp from 'components/AlertsApp';
import Navbar from 'components/Navbar';
import { monitorSessionTimeout } from 'util/timeoutSession';

Navbar.renderToDOM();
AlertsApp.renderToDOM();

monitorSessionTimeout();
