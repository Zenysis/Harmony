// @flow
import * as React from 'react';
import Promise from 'bluebird';
import invariant from 'invariant';

import ProgressBar from 'components/ui/ProgressBar';
import Toaster from 'components/ui/Toaster';
import VendorScript from 'vendor/models/VendorScript';
import autobind from 'decorators/autobind';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import { render2canvas } from 'components/common/SharingUtil/canvas_util';

const TEXT = t('query_result.common.download_as_image');
const IMAGE_BUTTON_TEXT = t('query_result.common.download_as_image.title');
const PDF_BUTTON_TEXT = t('query_result.common.download_as_pdf');
const DOCX_BUTTON_TEXT = t('query_result.common.download_as_docx');
const PPTX_BUTTON_TEXT = t('query_result.common.download_as_pptx');

// the type returned by the LiterallyCanvas library
// NOTE(pablo): Currently $AllowAny because we don't know the type
type LiterallyCanvas = $AllowAny;

function setupDrawingCanvas(
  annotationContainer: HTMLDivElement,
  renderedCanvas: HTMLCanvasElement,
): LiterallyCanvas {
  const img = new Image();
  img.src = renderedCanvas.toDataURL();

  // Calculate what scale will allow the image to be displayed in full inside
  // the LiterallyCanvas annotation window. Subtract the LiterallyCanvas
  // "chrome" from the dimensions.
  const scale = Math.min(
    (annotationContainer.clientWidth - 60) / renderedCanvas.width,
    (annotationContainer.clientHeight - 30) / renderedCanvas.height,
  );

  const output = window.LC.init(annotationContainer, {
    imageURLPrefix: '/images/literallycanvas',
    backgroundShapes: [
      window.LC.createShape('Image', { x: 0, y: 0, image: img }),
    ],
  });

  // Scale the background image using zoom level instead of resizing the
  // rendered canvas.
  output.setZoom(scale);
  output.setPan(0, 0);
  return output;
}

function toastSuccessfulDownload(): void {
  Toaster.success(TEXT.success);
}

// Build the docx embedded HTML content.
function buildDocxContent(imgData): string {
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

function exportAsImage(
  image: HTMLCanvasElement,
  rect: { height: number, width: number },
): void {
  const name = `Export ${new Date().toUTCString()}.png`;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  context.clearRect(0, 0, rect.width, rect.height);
  canvas.width = rect.width;
  canvas.height = rect.height;
  context.drawImage(image, 0, 0);

  canvas.toBlob(blob => {
    window.saveAs(blob, name);
  });
  toastSuccessfulDownload();
}

function exportAsPDF(image: HTMLCanvasElement): void {
  const doc = new window.jsPDF(); // eslint-disable-line new-cap
  const widthRatio = doc.internal.pageSize.width / image.width;
  const heightRatio = doc.internal.pageSize.height / image.height;
  const width = Math.min(heightRatio, widthRatio) * image.width;
  const height = Math.min(heightRatio, widthRatio) * image.height;

  doc.addImage(image.toDataURL(), 'JPEG', 0, 0, width, height);

  const name = `Export ${new Date().toUTCString()}.pdf`;
  doc.save(name);
  toastSuccessfulDownload();
}

function exportAsDocx(image: HTMLCanvasElement): void {
  const name = `Export ${new Date().toUTCString()}.docx`;
  const data = window.htmlDocx.asBlob(buildDocxContent(image.toDataURL()), {
    orientation: 'landscape',
  });
  window.saveAs(data, name);
  toastSuccessfulDownload();
}

function exportAsPPTX(
  image: HTMLCanvasElement,
  rect: { height: number, width: number },
) {
  const pptx = new window.PptxGenJS();
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
];

type Props = {
  element: HTMLElement,
};

type State = {
  loading: boolean,
};

export default class AnnotateCanvas extends React.PureComponent<Props, State> {
  state: State = {
    loading: true,
  };

  // Store the canvas drawing promise.
  _canvasPromise: Promise<void> = Promise.resolve();

  // The canvas element that LiterallyCanvas will draw on.
  _annotationContainer: ?HTMLDivElement = undefined;

  // LiterallyCanvas object.
  _lc: LiterallyCanvas | void = undefined;

  componentDidMount(): void {
    this._canvasPromise = this.populate();
  }

  componentWillUnmount(): void {
    if (this._canvasPromise && this._canvasPromise.isPending()) {
      this._canvasPromise.cancel();
    }
  }

  populate(): Promise<void> {
    return VendorScript.loadAll(DEPENDENT_SCRIPTS).then(() => {
      render2canvas(this.props.element)
        .then((canvas: HTMLCanvasElement) => {
          if (this._annotationContainer) {
            this._lc = setupDrawingCanvas(this._annotationContainer, canvas);
          }
        })
        .then(() => {
          this.setState({ loading: false });
        });
    });
  }

  buildImageForExport(): HTMLCanvasElement {
    // Need to reset the tool used on the canvas before building the image so
    // that in-progress shapes (like text) will be committed to the canvas
    // before export. Otherwise, they will not be included in the export.
    invariant(this._lc, 'LiterallyCanvas library must have been loaded');
    if (this._lc.tool) {
      this._lc.setTool(this._lc.tool);
    }
    return this._lc.getImage();
  }

  @autobind
  onExportToImage() {
    if (this._lc) {
      const imageRect = this._lc.getDefaultImageRect();
      exportAsImage(this.buildImageForExport(), imageRect);
    }
  }

  @autobind
  onExportToPDF() {
    if (this._lc) {
      exportAsPDF(this.buildImageForExport());
    }
  }

  @autobind
  onExportToDocx() {
    if (this._lc) {
      exportAsDocx(this.buildImageForExport());
    }
  }

  @autobind
  onExportToPPTX() {
    if (this._lc) {
      const imageRect = this._lc.getDefaultImageRect();
      exportAsPPTX(this.buildImageForExport(), imageRect);
    }
  }

  renderAnnotationContainer(): React.Node {
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
        {renderButton(PDF_BUTTON_TEXT, this.onExportToPDF)}
        {renderButton(DOCX_BUTTON_TEXT, this.onExportToDocx)}
        {renderButton(PPTX_BUTTON_TEXT, this.onExportToPPTX)}
      </div>
    );
  }

  render(): React.Node {
    return (
      <div className="annotate-canvas">
        <ProgressBar enabled={this.state.loading} />
        {this.renderAnnotationContainer()}
      </div>
    );
  }
}
