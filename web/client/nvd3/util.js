import d3Util from 'components/QueryResult/d3Util';

// Wrap svg <text> d3 nodes into a multiline version split by width
// eslint-disable-next-line import/prefer-default-export
export function wrapText(textElts, width, fontSize = '12px') {
  textElts.call(d3Util.wrapText, width, fontSize);
}
