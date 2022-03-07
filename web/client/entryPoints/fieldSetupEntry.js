// @flow
import FieldSetupApp from 'components/FieldSetupApp';
import Navbar from 'components/Navbar';
import { monitorSessionTimeout } from 'util/timeoutSession';

Navbar.renderToDOM();
FieldSetupApp.renderToDOM();

monitorSessionTimeout();
