// Now set up react.
import DataUploadApp from 'components/DataUploadApp';
import Navbar from 'components/Navbar';
import { monitorSessionTimeout } from 'util/timeoutSession';

Navbar.renderToDOM();
DataUploadApp.renderToDOM();

monitorSessionTimeout();
