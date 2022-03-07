// @flow
import Navbar from 'components/Navbar';
import Overview from 'components/Overview';
import { monitorSessionTimeout } from 'util/timeoutSession';

Navbar.renderToDOM();
Overview.renderToDOM();

monitorSessionTimeout();
