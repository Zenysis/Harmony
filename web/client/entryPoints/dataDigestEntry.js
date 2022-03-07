// @flow
import DataDigestApp from 'components/DataDigestApp';
import Navbar from 'components/Navbar';
import { monitorSessionTimeout } from 'util/timeoutSession';

Navbar.renderToDOM();
DataDigestApp.renderToDOM();

monitorSessionTimeout();
