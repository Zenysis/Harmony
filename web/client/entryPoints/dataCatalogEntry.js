// @flow
import DataCatalogApp from 'components/DataCatalogApp';
import Navbar from 'components/Navbar';
import { monitorSessionTimeout } from 'util/timeoutSession';

Navbar.renderToDOM();
DataCatalogApp.renderToDOM();

monitorSessionTimeout();
