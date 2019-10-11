import React from 'react';
import ReactDOM from 'react-dom';

import DependentVendorScript from 'vendor/models/DependentVendorScript';
import VendorScript from 'vendor/models/VendorScript';

// Define all non-dependent scripts at the same time
// eslint-disable-next-line import/prefer-default-export
export const VENDOR_SCRIPTS = {
  d3: VendorScript.create('d3.v3.js'),
  filesaver: VendorScript.create('filesaver-1.3.3.js'),
  htmldocx: VendorScript.create('htmldocx-0.3.1.js'),
  jsInterpreter: VendorScript.create('acorn_interpreter.js'),
  mapbox: VendorScript.create('mapbox-3.0.1.js'),
  plotly: VendorScript.create('plotly-1.22.0.js'),
  toastr: VendorScript.create('toastr-2.1.2.js'),
  labelgun: VendorScript.create('labelgun.js'),
};

// Html2Canvas uses a bad SVG rendering library. This function disables SVG
// rendering within the library.
VENDOR_SCRIPTS.html2canvas = VendorScript.create(
  'html2canvas-1.0.0-alpha12.js',
);

// LiterallyCanvas needs access to React and ReactDOM to work. Temporarily
// expose them during initialization so that the vendor js parses and
// initializes properly.
VENDOR_SCRIPTS.literallycanvas = VendorScript.create('literallycanvas-0.5.0.js')
  .before(() => {
    window.React = React;
    window.ReactDOM = ReactDOM;
  })
  .after(() => {
    delete window.React;
    delete window.ReactDOM;
  });

VENDOR_SCRIPTS.explodingBoxplot = DependentVendorScript.create(
  'explodingBoxplot.js',
  VENDOR_SCRIPTS.d3,
);

VENDOR_SCRIPTS.leafletShapes = DependentVendorScript.create(
  'leaflet-svg-shape-markers.js',
  VENDOR_SCRIPTS.mapbox,
);

VENDOR_SCRIPTS.leafletHeat = DependentVendorScript.create(
  'leaflet-heat-0.2.0.js',
  VENDOR_SCRIPTS.mapbox,
);

VENDOR_SCRIPTS.pptxgen = DependentVendorScript.create(
  'pptxgen-1.3.0.js',
  // NOTE(stephen): jszip isn't used by anything but pptxgen.
  VendorScript.create('jszip-3.1.1.js'),
);

// Jspdf packages its own version of html2canvas that conflicts with the version
// we use. Make sure the html2canvas that we need does not get overwritten
// by the packaged version.
VENDOR_SCRIPTS.jspdf = DependentVendorScript.create(
  'jspdf-1.3.3.js',
  VENDOR_SCRIPTS.html2canvas,
)
  .afterDependencyLoad(() => {
    window.html2canvasOrig = window.html2canvas;
  })
  .after(() => {
    window.html2canvas = window.html2canvasOrig;
    delete window.html2canvasOrig;
  });

VENDOR_SCRIPTS.zipcelx = DependentVendorScript.create(
  'zipcelx-1.4.0.js',
  VENDOR_SCRIPTS.filesaver,
);

// TODO(stephen): Ensure there are no dependency cycles
