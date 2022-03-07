// @flow
import DataQualityApp from 'components/DataQualityApp';
import Navbar from 'components/Navbar';
import { monitorSessionTimeout } from 'util/timeoutSession';

Navbar.renderToDOM();
DataQualityApp.renderToDOM();

monitorSessionTimeout();
