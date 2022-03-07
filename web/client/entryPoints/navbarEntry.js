// @flow
/**
 * Use this entry point for HTML templates where Navbar is the ONLY JS
 * dependency.
 *
 * Otherwise, like in `templates/query.html`, if you have other JS dependencies,
 * you should create a new entry point (e.g. queryEntry.jsx), and then render
 * the Navbar within that entry point. Do not include navbarEntry.jsx anymore,
 * otherwise you'll be downloading a lot of duplicate boilerplate.
 */

import Navbar from 'components/Navbar';

Navbar.renderToDOM();
