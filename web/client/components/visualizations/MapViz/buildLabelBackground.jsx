// @flow
import type { RGBColor } from 'react-color';

import type { MapboxGLMapShape } from 'components/visualizations/MapViz/QueryResultLayer/types';

/**
 * Create a background image with the given color and add it to the map. Mapbox
 * does not provide a way for us to set a background image for a text label
 * right now, it must be an image. To avoid having to load an image over the
 * network, we can create a bitmap image manually and add it to the map.
 *
 * NOTE(stephen): This method is based off an approach that Mapbox uses in their
 * debug code when implementing the stretchable image background feature.
 * https://github.com/mapbox/mapbox-gl-js/blob/v1.8.1/debug/stretchable.html#L29
 */
export default function buildLabelBackground(
  { r, g, b }: RGBColor,
  map: ?MapboxGLMapShape,
  size: number = 64,
  borderSize: number = 4,
): string {
  const id = `label-background-${r}-${g}-${b}--${size}`;
  if (!map || map.hasImage(id)) {
    return id;
  }

  // Each pixel is represented by 4 bytes: red, green, blue, and alpha.
  const bytesPerPixel = 4;
  const data = new Uint8Array(size * size * bytesPerPixel);
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      const offset = (y * size + x) * bytesPerPixel;
      data[offset] = r;
      data[offset + 1] = g;
      data[offset + 2] = b;
      // Alpha is always on. We control opacity through the icon-opacity paint
      // property.
      data[offset + 3] = 255;
    }
  }
  const stretch = [
    [borderSize, (size - borderSize) / 2],
    [(size + borderSize) / 2, size - borderSize],
  ];
  map.addImage(
    id,
    { data, height: size, width: size },
    {
      content: [borderSize, borderSize, size - borderSize, size - borderSize],
      stretchX: stretch,
      stretchY: stretch,
    },
  );
  return id;
}
