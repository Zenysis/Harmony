import React from 'react';
import PropTypes from 'prop-types';

import ProgressBar from 'components/ui/ProgressBar';
import VendorScript from 'vendor/models/VendorScript';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import { render2canvas } from 'components/QueryResult/QueryResultActionButtons/canvas_util';

const propTypes = {
  // NOTE(stephen): Technically a DOM element, but React doesn't have that as a
  // builtin PropType.
  element: PropTypes.object.isRequired,
};

const TEXT = t('query_result.common.download_as_image');
const IMAGE_BUTTON_TEXT = t('query_result.common.download_as_image.title');
const PDF_BUTTON_TEXT = t('query_result.common.download_as_pdf');
const DOCX_BUTTON_TEXT = t('query_result.common.download_as_docx');
const PPTX_BUTTON_TEXT = t('query_result.common.download_as_pptx');

function setupDrawingCanvas(annotationContainer, renderedCanvas) {
  const img = new Image();
  img.src = renderedCanvas.toDataURL();

  const $annotationContainer = $(annotationContainer);

  // Calculate what scale will allow the image to be displayed in full inside
  // the LiterallyCanvas annotation window. Subtract the LiterallyCanvas
  // "chrome" from the dimensions.
  const scale = Math.min(
    ($annotationContainer.width() - 60) / renderedCanvas.width,
    ($annotationContainer.height() - 30) / renderedCanvas.height,
  );

  const output = window.LC.init(annotationContainer, {
    imageURLPrefix: '/images/literallycanvas',
    backgroundShapes: [LC.createShape('Image', { x: 0, y: 0, image: img })],
  });

  // Scale the background image using zoom level instead of resizing the
  // rendered canvas.
  output.setZoom(scale);
  output.setPan(0, 0);
  return output;
}

function toastSuccessfulDownload() {
  toastr.success(TEXT.success);
}

// Build the docx embedded HTML content.
function buildDocxContent(imgData) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title></title>
        <style>
          .image{
            width: 2550px;
            height: auto;
          }
        </style>
      </head>
      <body>
        <img class="image" src="${imgData}" />
      </body>
    </html>`;
}

function exportAsImage(image, rect) {
  const name = `Export ${new Date().toUTCString()}.png`;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  context.clearRect(0, 0, rect.width, rect.height);
  canvas.width = rect.width;
  canvas.height = rect.height;
  context.drawImage(image, 0, 0);

  canvas.toBlob(blob => {
    saveAs(blob, name);
  });
  toastSuccessfulDownload();
}

function exportAsPdf(image) {
  const doc = new jsPDF(); // eslint-disable-line new-cap
  const widthRatio = doc.internal.pageSize.width / image.width;
  const heightRatio = doc.internal.pageSize.height / image.height;
  const width = Math.min(heightRatio, widthRatio) * image.width;
  const height = Math.min(heightRatio, widthRatio) * image.height;

  doc.addImage(image.toDataURL(), 'JPEG', 0, 0, width, height);

  const name = `Export ${new Date().toUTCString()}.pdf`;
  doc.save(name);
  toastSuccessfulDownload();
}

function exportAsDocx(image) {
  const name = `Export ${new Date().toUTCString()}.docx`;
  const data = htmlDocx.asBlob(buildDocxContent(image.toDataURL()), {
    orientation: 'landscape',
  });
  saveAs(data, name);
  toastSuccessfulDownload();
}

function exportAsPptx(image, rect) {
  const pptx = new PptxGenJS();
  const slide = pptx.addNewSlide();
  slide.addImage({
    data: image.toDataURL(),
    x: 1.0,
    y: 1.0,
    w: 7.0,
    h: (7.0 * rect.height) / rect.width,
  });

  const name = `Export ${new Date().toUTCString()}.pptx`;
  pptx.save(name);
  toastSuccessfulDownload();
}

function renderButton(text, onClick) {
  return (
    <button
      type="button"
      className="btn btn-large btn-primary"
      onClick={onClick}
    >
      {text}
    </button>
  );
}

const DEPENDENT_SCRIPTS = [
  VENDOR_SCRIPTS.filesaver,
  VENDOR_SCRIPTS.htmldocx,
  VENDOR_SCRIPTS.jspdf,
  VENDOR_SCRIPTS.literallycanvas,
  VENDOR_SCRIPTS.pptxgen,
  VENDOR_SCRIPTS.toastr,
];

export default class AnnotateCanvas extends React.PureComponent {
  constructor() {
    super();

    this.state = {
      loading: true,
    };

    // Store the canvas drawing promise.
    this._canvasPromise = undefined;

    // The canvas element that LiterallyCanvas will draw on.
    this._annotationContainer = undefined;

    // LiterallyCanvas object.
    this._lc = undefined;

    this.onExportToImage = () =>
      exportAsImage(this.buildImageForExport(), this._lc.getDefaultImageRect());
    this.onExportToPdf = () => exportAsPdf(this.buildImageForExport());
    this.onExportToDocx = () => exportAsDocx(this.buildImageForExport());
    this.onExportToPptx = () =>
      exportAsPptx(this.buildImageForExport(), this._lc.getDefaultImageRect());
  }

  componentDidMount() {
    this._canvasPromise = this.populate();
  }

  componentWillUnmount() {
    if (this._canvasPromise && this._canvasPromise.isPending()) {
      this._canvasPromise.cancel();
    }
  }

  populate() {
    return VendorScript.loadAll(DEPENDENT_SCRIPTS).then(() => {
      render2canvas(this.props.element)
        .then(canvas => {
          this._lc = setupDrawingCanvas(this._annotationContainer, canvas);
        })
        .then(() => {
          this.setState({ loading: false });
        });
    });
  }

  buildImageForExport() {
    // Need to reset the tool used on the canvas before building the image so
    // that in-progress shapes (like text) will be committed to the canvas
    // before export. Otherwise, they will not be included in the export.
    if (this._lc.tool) {
      this._lc.setTool(this._lc.tool);
    }
    return this._lc.getImage();
  }

  renderAnnotationContainer() {
    // Choosing visibility hidden vs display none to allow third party
    // libraries that interact with the block to perform setup as if the
    // block is rendered.
    const style = this.state.loading ? { visibility: 'hidden' } : undefined;

    return (
      <div className="annotation-container" style={style}>
        <div
          ref={e => {
            this._annotationContainer = e;
          }}
          className="annotation-container-inner"
        />
        {renderButton(IMAGE_BUTTON_TEXT, this.onExportToImage)}
        {renderButton(PDF_BUTTON_TEXT, this.onExportToPdf)}
        {renderButton(DOCX_BUTTON_TEXT, this.onExportToDocx)}
        {renderButton(PPTX_BUTTON_TEXT, this.onExportToPptx)}
      </div>
    );
  }

  render() {
    return (
      <div className="annotate-canvas">
        <ProgressBar enabled={this.state.loading} />
        {this.renderAnnotationContainer()}
      </div>
    );
  }
}

AnnotateCanvas.propTypes = propTypes;
