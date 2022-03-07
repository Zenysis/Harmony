// @flow
import AdvancedQueryApp from 'components/AdvancedQueryApp';
import Navbar from 'components/Navbar';
import { monitorSessionTimeout } from 'util/timeoutSession';

Navbar.renderToDOM();
AdvancedQueryApp.renderToDOM();

monitorSessionTimeout();
