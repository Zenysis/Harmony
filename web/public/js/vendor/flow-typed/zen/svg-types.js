/**
 * NOTE(pablo): Due to a lack of SVG type annotations in Flow, we are using
 * these annotations as a stopgap. In general there should never really be a
 * need to directly refer to SVGs in our codebase. This file should be removed
 * when the relevant PRs to Flow have merged.
 *
 * They have been pulled from:
 *   https://gist.github.com/jstafford/97de1d8e20483f08658dbaad95dec780
 * Which in turn were pulled from this PR:
 *   https://github.com/facebook/flow/pull/4551/files
 * And the accompanying discussion:
 *   https://github.com/facebook/flow/pull/4551
 *
 * All these types are based on the official SVG Spec:
 *   https://svgwg.org/svg2-draft/types.html#DOMInterfacesForSVGElements
 */

declare class SVGMatrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;

  getComponent(index: number): number;
  mMultiply(secondMatrix: SVGMatrix): SVGMatrix;
  mTranslate(x: number, y: number): SVGMatrix;
  mScale(scaleFactor: number): SVGMatrix;
  mRotate(angle: number): SVGMatrix;
  multiply(secondMatrix: SVGMatrix): SVGMatrix;
  inverse(): SVGMatrix;
  translate(x: number, y: number): SVGMatrix;
  scale(scaleFactor: number): SVGMatrix;
  scaleNonUniform(scaleFactorX: number, scaleFactorY: number): SVGMatrix;
  rotate(angle: number): SVGMatrix;
  rotateFromVector(x: number, y: number): SVGMatrix;
  flipX(): SVGMatrix;
  flipY(): SVGMatrix;
  skewX(angle: number): SVGMatrix;
  skewY(angle: number): SVGMatrix;
}

declare interface SVGNumber {
  value: number;
}

declare interface SVGAngle {
  SVG_ANGLETYPE_UNKNOWN: 0;
  SVG_ANGLETYPE_UNSPECIFIED: 1;
  SVG_ANGLETYPE_DEG: 2;
  SVG_ANGLETYPE_RAD: 3;
  SVG_ANGLETYPE_GRAD: 4;

  unitType: number;
  value: number;
  valueInSpecifiedUnits: number;
  valueAsString: string;

  newValueSpecifiedUnits(unitType: number, valueInSpecifiedUnits: number): void;
  convertToSpecifiedUnits(unitType: number): void;
}

declare interface SVGLength {
  SVG_LENGTHTYPE_UNKNOWN: 0;
  SVG_LENGTHTYPE_NUMBER: 1;
  SVG_LENGTHTYPE_PERCENTAGE: 2;
  SVG_LENGTHTYPE_EMS: 3;
  SVG_LENGTHTYPE_EXS: 4;
  SVG_LENGTHTYPE_PX: 5;
  SVG_LENGTHTYPE_CM: 6;
  SVG_LENGTHTYPE_MM: 7;
  SVG_LENGTHTYPE_IN: 8;
  SVG_LENGTHTYPE_PT: 9;
  SVG_LENGTHTYPE_PC: 10;

  unitType: number;
  value: number;
  valueInSpecifiedUnits: number;
  valueAsString: string;

  newValueSpecifiedUnits(unitType: number, valueInSpecifiedUnits: number): void;
  convertToSpecifiedUnits(unitType: number): void;
}

declare interface SVGAnimatedLength {
  baseVal: SVGLength;
  animVal: SVGLength;
}

declare interface SVGRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

declare interface SVGAnimatedRect {
  baseVal: SVGRect;
  animVal: SVGRect;
}

declare interface SVGPreserveAspectRatio {
  // Alignment Types
  SVG_PRESERVEASPECTRATIO_UNKNOWN: 0;
  SVG_PRESERVEASPECTRATIO_NONE: 1;
  SVG_PRESERVEASPECTRATIO_XMINYMIN: 2;
  SVG_PRESERVEASPECTRATIO_XMIDYMIN: 3;
  SVG_PRESERVEASPECTRATIO_XMAXYMIN: 4;
  SVG_PRESERVEASPECTRATIO_XMINYMID: 5;
  SVG_PRESERVEASPECTRATIO_XMIDYMID: 6;
  SVG_PRESERVEASPECTRATIO_XMAXYMID: 7;
  SVG_PRESERVEASPECTRATIO_XMINYMAX: 8;
  SVG_PRESERVEASPECTRATIO_XMIDYMAX: 9;
  SVG_PRESERVEASPECTRATIO_XMAXYMAX: 10;

  // Meet-or-slice Types
  SVG_MEETORSLICE_UNKNOWN: 0;
  SVG_MEETORSLICE_MEET: 1;
  SVG_MEETORSLICE_SLICE: 2;

  align: number;
  meetOrSlice: number;
}

declare interface SVGAnimatedPreserveAspectRatio {
  baseVal: SVGPreserveAspectRatio;
  animVal: SVGPreserveAspectRatio;
}

declare interface SVGTransform {
  SVG_TRANSFORM_UNKNOWN: 0;
  SVG_TRANSFORM_MATRIX: 1;
  SVG_TRANSFORM_TRANSLATE: 2;
  SVG_TRANSFORM_SCALE: 3;
  SVG_TRANSFORM_ROTATE: 4;
  SVG_TRANSFORM_SKEWX: 5;
  SVG_TRANSFORM_SKEWY: 6;

  type: number;
  matrix: SVGMatrix;
  angle: number;

  setMatrix(matrix: SVGMatrix): void;
  setTranslate(tx: number, ty: number): void;
  setScale(sx: number, sy: number): void;
  setRotate(angle: number, cx: number, cy: number): void;
  setSkewX(angle: number): void;
  setSkewY(angle: number): void;
}

declare interface SVGTransformList {
  length: number;
  numberOfItems: number;

  clear(): void;
  initialize(newItem: SVGTransform): SVGTransform;
  getItem(index: number): SVGTransform;
  insertItemBefore(newItem: SVGTransform, index: number): SVGTransform;
  replaceItem(newItem: SVGTransform, index: number): SVGTransform;
  removeItem(index: number): SVGTransform;
  appendItem(newItem: SVGTransform): SVGTransform;
  createSVGTransformFromMatrix(matrix: SVGMatrix): SVGTransform;
  consolidate(): SVGTransform;
}

declare class SVGElement extends Element {
  ownerSVGElement: SVGSVGElement | null;
  viewportElement: SVGElement | null;
}

declare interface SVGViewSpec {
  transform: SVGTransformList;
  viewTarget: SVGElement;
  viewBoxString: string;
  preserveAspectRatioString: string;
  transformString: string;
  viewTargetString: string;

  SVG_ZOOMANDPAN_UNKNOWN: 0;
  SVG_ZOOMANDPAN_DISABLE: 1;
  SVG_ZOOMANDPAN_MAGNIFY: 2;
  zoomAndPan: number;

  viewBox: SVGAnimatedRect;
  preserveAspectRatio: SVGAnimatedPreserveAspectRatio;
}

declare class SVGPoint {
  x: number;
  y: number;
  z: number;
  w: number;

  matrixTransform(matrix: SVGMatrix): SVGPoint;
}

declare class SVGPointList {
  length: number;
  numberOfItems: number;

  clear(): void;
  initialize(newItem: SVGPoint): SVGPoint;
  getItem(index: number): SVGPoint;
  insertItemBefore(newItem: SVGPoint, index: number): SVGPoint;
  replaceItem(newItem: SVGPoint, index: number): SVGPoint;
  removeItem(index: number): SVGPoint;
  appendItem(newItem: SVGPoint): SVGPoint;
}

declare interface SVGAnimatedNumber {
  baseVal: number;
  +animVal: number;
}

declare interface SVGAnimatedString {
  baseVal: string;
  +animVal: string;
}

declare interface SVGURIReference {
  +href: SVGAnimatedString;
}

declare interface SVGStringList {
  +length: number;
  +numberOfItems: number;

  clear(): void;
  initialize(newItem: string): string;
  getItem(index: number): string;
  insertItemBefore(newItem: string, index: number): string;
  replaceItem(newItem: string, index: number): string;
  removeItem(index: number): string;
  appendItem(newItem: string): string;
}

declare interface SVGTests {
  requiredFeatures: SVGStringList; //readonly
  requiredExtensions: SVGStringList; //readonly
  systemLanguage: SVGStringList; //readonly

  hasExtension(extension: string): boolean;
}

declare interface SVGLangSpace {
  xmllang: string;
  xmlspace: string;
}

declare interface SVGAnimatedBoolean {
  baseVal: boolean;
  animVal: boolean; //readonly
}

declare interface SVGExternalResourcesRequired {
  externalResourcesRequired: SVGAnimatedBoolean; //readonly
}

declare interface CSSValue {
  CSS_INHERIT: number;
  CSS_PRIMITIVE_VALUE: number;
  CSS_VALUE_LIST: number;
  CSS_CUSTOM: number;

  cssText: string;
  cssValueType: number; //readonly
}

declare interface SVGStylable {
  className: SVGAnimatedString; //readonly
  style: CSSStyleDeclaration; //readonly

  getPresentationAttribute(name: string): CSSValue;
}

declare interface SVGLocatable {
  nearestViewportElement: SVGElement; //readonly
  farthestViewportElement: SVGElement; //readonly

  getBBox(): SVGRect;
  getCTM(): SVGMatrix;
  getScreenCTM(): SVGMatrix;
  getTransformToElement(element: SVGElement): SVGMatrix;
}

declare interface SVGAnimatedTransformList {
  baseVal: SVGTransformList;
  animVal: SVGTransformList;
}

declare interface SVGTransformable extends SVGLocatable {
  transform: SVGAnimatedTransformList; //readonly
}

declare interface SVGAElement
  extends SVGElement,
    SVGURIReference,
    SVGTests,
    SVGLangSpace,
    SVGExternalResourcesRequired,
    SVGStylable,
    SVGTransformable {
  target: SVGAnimatedString; //readonly
}

declare interface SVGFitToViewBox {
  viewBox: SVGAnimatedRect; //readonly
  preserveAspectRatio: SVGAnimatedPreserveAspectRatio; //readonly
}

declare interface SVGZoomAndPan {
  SVG_ZOOMANDPAN_UNKNOWN: number;
  SVG_ZOOMANDPAN_DISABLE: number;
  SVG_ZOOMANDPAN_MAGNIFY: number;

  zoomAndPan: number;
}

declare interface SVGViewElement
  extends SVGElement,
    SVGExternalResourcesRequired,
    SVGFitToViewBox,
    SVGZoomAndPan {
  viewTarget: SVGStringList; //readonly
}

declare interface SVGBoundingBoxOptions {
  fill: boolean;
  stroke: boolean;
  markers: boolean;
  clipped: boolean;
}

declare class SVGGraphicsElement extends SVGElement {
  transform: SVGAnimatedTransformList;
  getBBox(options?: SVGBoundingBoxOptions): SVGRect;
  getCTM(): SVGMatrix | null;
  getScreenCTM(): SVGMatrix | null;
}

declare interface DOMPointInit {
  x: number;
  y: number;
  z: number;
  w: number;
}

declare class SVGGeometryElement extends SVGGraphicsElement {
  pathLength: SVGAnimatedNumber;
  isPointInFill(point?: DOMPointInit): boolean;
  isPointInStroke(point?: DOMPointInit): boolean;
  getTotalLength(): number;
  getPointAtLength(distance: number): SVGPoint;
}

declare class SVGSVGElement extends SVGGraphicsElement {
  x: SVGAnimatedLength;
  y: SVGAnimatedLength;
  width: SVGAnimatedLength;
  height: SVGAnimatedLength;
  contentScriptType: string;
  contentStyleType: string;
  viewport: SVGRect;
  pixelUnitToMillimeterX: number;
  pixelUnitToMillimeterY: number;
  screenPixelToMillimeterX: number;
  screenPixelToMillimeterY: number;
  useCurrentView: boolean;
  currentView: SVGViewSpec;
  currentScale: number;
  currentTranslate: SVGPoint;

  suspendRedraw(maxWaitMilliseconds: number): number;
  unsuspendRedraw(suspendHandleID: number): void;
  unsuspendRedrawAll(): void;
  forceRedraw(): void;
  pauseAnimations(): void;
  unpauseAnimations(): void;
  animationsPaused(): boolean;
  getCurrentTime(): number;
  setCurrentTime(seconds: number): void;
  getIntersectionList(
    rect: SVGRect,
    referenceElement: SVGElement,
  ): NodeList<SVGElement>;
  getEnclosureList(
    rect: SVGRect,
    referenceElement: SVGElement,
  ): NodeList<SVGElement>;
  checkIntersection(element: SVGElement, rect: SVGRect): boolean;
  checkEnclosure(element: SVGElement, rect: SVGRect): boolean;
  deselectAll(): void;
  createSVGNumber(): SVGNumber;
  createSVGLength(): SVGLength;
  createSVGAngle(): SVGAngle;
  createSVGPoint(): SVGPoint;
  createSVGMatrix(): SVGMatrix;
  createSVGRect(): SVGRect;
  createSVGTransform(): SVGTransform;
  createSVGTransformFromMatrix(matrix: SVGMatrix): SVGTransform;
  getElementById(elementId: string): Element;

  // also implements the interface of SVGFitToViewBox
  viewBox: SVGAnimatedRect; // readonly
  preserveAspectRatio: SVGAnimatedPreserveAspectRatio; // readonly
}

declare class SVGRectElement extends SVGGeometryElement {
  x: SVGAnimatedLength;
  y: SVGAnimatedLength;
  width: SVGAnimatedLength;
  height: SVGAnimatedLength;
  rx: SVGAnimatedLength;
  ry: SVGAnimatedLength;
}

declare class SVGCircleElement extends SVGGeometryElement {
  cx: SVGAnimatedLength;
  cy: SVGAnimatedLength;
  y: SVGAnimatedLength;
}

declare class SVGEllipseElement extends SVGGeometryElement {
  cx: SVGAnimatedLength;
  cy: SVGAnimatedLength;
  rx: SVGAnimatedLength;
  ry: SVGAnimatedLength;
}

declare class SVGLineElement extends SVGGeometryElement {
  x1: SVGAnimatedLength;
  y1: SVGAnimatedLength;
  x2: SVGAnimatedLength;
  y2: SVGAnimatedLength;
}

declare class SVGPolylineElement extends SVGGeometryElement {
  points: SVGPointList;
  animatedPoints: SVGPointList;
}

declare class SVGPolygonElement extends SVGGeometryElement {
  points: SVGPointList;
  animatedPoints: SVGPointList;
}
