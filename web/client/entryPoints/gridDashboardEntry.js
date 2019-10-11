// Now set up react.
import GridDashboardApp from 'components/GridDashboardApp';
import Navbar from 'components/Navbar';
import { monitorSessionTimeout } from 'util/timeoutSession';

Navbar.renderToDOM();
GridDashboardApp.renderToDOM();

monitorSessionTimeout();
