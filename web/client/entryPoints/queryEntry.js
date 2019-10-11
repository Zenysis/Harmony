// Now set up react.
import Navbar from 'components/Navbar';
import QueryApp from 'components/QueryApp';
import { monitorSessionTimeout } from 'util/timeoutSession';

Navbar.renderToDOM();
QueryApp.renderToDOM({
  scrollNewResultsIntoView: true,
});

monitorSessionTimeout();
