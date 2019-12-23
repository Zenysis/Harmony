// @flow
import Analyze from 'components/ui/Icon/internal/SVGs/Analyze';
import BirthdayCake from 'components/ui/Icon/internal/SVGs/BirthdayCake';
import Calendar from 'components/ui/Icon/internal/SVGs/Calendar';
import DragIndicator from 'components/ui/Icon/internal/SVGs/DragIndicator';
import Flashlight from 'components/ui/Icon/internal/SVGs/Flashlight';
import Globe from 'components/ui/Icon/internal/SVGs/Globe';
import Invisible from 'components/ui/Icon/internal/SVGs/Invisible';
import QuestionMark from 'components/ui/Icon/internal/SVGs/QuestionMark';
import Repeat from 'components/ui/Icon/internal/SVGs/Repeat';
import TrendingDown from 'components/ui/Icon/internal/SVGs/TrendingDown';
import TrendingUp from 'components/ui/Icon/internal/SVGs/TrendingUp';
import { VISUALIZATIONS_SVG_MAP } from 'components/ui/Icon/internal/SVGs/VisualizationIcons';
import type { VisualizationsSVGMap } from 'components/ui/Icon/internal/SVGs/VisualizationIcons';

/*
 * All SVG type names should be pre-fixed with 'svg'
 * to avoid possible naming clashes with glyphicons.
 *
 * When adding SVGs we can use https://jakearchibald.github.io/svgomg/ to
 * simplify the SVG paths and avoid bloat. You will need to enable the "Prefer
 * viewBox to width/height" setting.
 */
type SVGMap = {|
  'svg-analyze': typeof Analyze,
  'svg-birthday-cake': typeof BirthdayCake,
  'svg-calendar': typeof Calendar,
  'svg-drag-indicator': typeof DragIndicator,
  'svg-flashlight': typeof Flashlight,
  'svg-globe': typeof Globe,
  'svg-invisible': typeof Invisible,
  'svg-question-mark': typeof QuestionMark,
  'svg-repeat': typeof Repeat,
  'svg-trending-down': typeof TrendingDown,
  'svg-trending-up': typeof TrendingUp,
  ...VisualizationsSVGMap,
|};

export const SVG_MAP: SVGMap = {
  'svg-analyze': Analyze,
  'svg-birthday-cake': BirthdayCake,
  'svg-calendar': Calendar,
  'svg-drag-indicator': DragIndicator,
  'svg-flashlight': Flashlight,
  'svg-globe': Globe,
  'svg-invisible': Invisible,
  'svg-question-mark': QuestionMark,
  'svg-repeat': Repeat,
  'svg-trending-down': TrendingDown,
  'svg-trending-up': TrendingUp,
  ...VISUALIZATIONS_SVG_MAP,
};

export type SVGType = $Keys<SVGMap>;
