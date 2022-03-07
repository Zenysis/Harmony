// @flow
import * as React from 'react';
import ReactDOM from 'react-dom';

import DependentVendorScript from 'vendor/models/DependentVendorScript';
import VendorScript from 'vendor/models/VendorScript';
import { patchPlotlyHoverEvent, patchD3Format } from 'vendor/registry/patches';

// Define all non-dependent scripts at the same time
const STANDALONE_VENDOR_SCRIPTS: {
  d3: VendorScript,
  filesaver: VendorScript,
  fhir: VendorScript,
  html2canvas: VendorScript,
  htmldocx: VendorScript,
  jsInterpreter: VendorScript,
  literallycanvas: VendorScript,
  plotly: VendorScript,
  toastr: VendorScript,
} = {
  d3: VendorScript.create({ scriptFile: 'd3.v3.js' }),
  filesaver: VendorScript.create({ scriptFile: 'filesaver-1.3.3.js' }),
  fhir: VendorScript.create({ scriptFile: 'fhir.js' }),
  html2canvas: VendorScript.create({
    scriptFile: 'html2canvas-1.0.0-alpha12.js',
  }),
  htmldocx: VendorScript.create({ scriptFile: 'htmldocx-0.3.1.js' }),
  jsInterpreter: VendorScript.create({ scriptFile: 'acorn_interpreter.js' }),

  // LiterallyCanvas needs access to React and ReactDOM to work. Temporarily
  // expose them during initialization so that the vendor js parses and
  // initializes properly.
  literallycanvas: VendorScript.create({
    scriptFile: 'literallycanvas-0.5.0.js',
  })
    .before(() => {
      window.React = React;
      window.ReactDOM = ReactDOM;
    })
    .after(() => {
      delete window.React;
      delete window.ReactDOM;
    }),
  plotly: VendorScript.create({
    scriptFile: 'plotly-1.22.0.js',
  }).after(() => {
    patchPlotlyHoverEvent();
    patchD3Format();
  }),
  toastr: VendorScript.create({ scriptFile: 'toastr-2.1.2.js' }),
};

const DEPENDENT_VENDOR_SCRIPTS: {|
  jspdf: DependentVendorScript,
  pptxgen: DependentVendorScript,
  zipcelx: DependentVendorScript,
|} = {
  // Jspdf packages its own version of html2canvas that conflicts with the
  // version we use. Make sure the html2canvas that we need does not get
  // overwritten by the packaged version.
  jspdf: DependentVendorScript.create({
    scriptFile: 'jspdf-1.3.3.js',
    dependencies: [STANDALONE_VENDOR_SCRIPTS.html2canvas],
  })
    .afterDependencyLoad(() => {
      window.html2canvasOrig = window.html2canvas;
    })
    .after(() => {
      window.html2canvas = window.html2canvasOrig;
      delete window.html2canvasOrig;
    }),
  pptxgen: DependentVendorScript.create({
    scriptFile: 'pptxgen-1.3.0.js',
    // NOTE(stephen): jszip isn't used by anything but pptxgen.
    dependencies: [VendorScript.create({ scriptFile: 'jszip-3.1.1.js' })],
  }),
  zipcelx: DependentVendorScript.create({
    scriptFile: 'zipcelx-1.4.0.js',
    dependencies: [STANDALONE_VENDOR_SCRIPTS.filesaver],
  }),
};

// TODO(stephen): Ensure there are no dependency cycles
export const VENDOR_SCRIPTS = {
  ...STANDALONE_VENDOR_SCRIPTS,
  ...DEPENDENT_VENDOR_SCRIPTS,
};
