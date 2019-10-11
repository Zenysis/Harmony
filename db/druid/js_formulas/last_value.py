from db.druid.js_formulas.base_formula import JSFormula, RESET_TO_ZERO_FN

# ========================== Last Value Computation ========================== #
# Calculate the last nonzero value for a specified field in a query.
# SQL Calculation Equivalent:
# SELECT
#   SUM(IF timestamp == MAX(timestamp) THEN value ELSE 0) AS last_value
# FROM T
# WHERE
#   value != 0
#
# Note: Druid is really not built for queries like this, so there are likely
# to be bugs and incorrect values computed in some cases. It is important to
# validate the query results when testing, and if you find errors, please
# show them to Stephen.

# Store the timestamp as the 10 most significant digits followed by the
# original value. Example: Timestamp 1483920000, Value 6441.03
# Result: 14839200006441.03
TIMESTAMP_PACK_FN = '''
function pack(timeInSeconds, value) {
  var prefix = (value < 0) ? '-' : '';
  return prefix + timeInSeconds + '' + Math.abs(value);
}'''

# Unpack a timestamp + value into [timestamp, value]
TIMESTAMP_UNPACK_FN = '''
function unpack(value) {
  var strValue = '' + Math.abs(value);
  if (strValue.length < 11) {
    return [0, 0];
  }

  var timeInSeconds = parseFloat(strValue.slice(0, 10));
  var curValue = parseFloat(strValue.slice(10));
  if (value < 0) {
    curValue *= -1;
  }
  return [timeInSeconds, curValue];
}'''

LAST_VALUE_AGGREGATE_FN = '''
function(current, timeInMilliseconds, inputValue) {
  %s
  %s

  if (inputValue == 0) {
    return current;
  }

  var timeInSeconds = timeInMilliseconds / 1000;
  if (current == 0) {
    return pack(timeInSeconds, inputValue);
  }

  var pieces = unpack(current);
  var currentTime = pieces[0];
  var currentValue = pieces[1];

  if (currentTime > timeInSeconds) {
    return current;
  }

  var value = inputValue;
  if (currentTime == timeInSeconds) {
    value += currentValue;
  }
  return pack(timeInSeconds, value);
}''' % (
    TIMESTAMP_PACK_FN,
    TIMESTAMP_UNPACK_FN,
)

LAST_VALUE_COMBINE_FN = '''
function(partialA, partialB) {
  %s
  %s

  var piecesA = unpack(partialA);
  var piecesB = unpack(partialB);

  if (!piecesA[0] && !piecesB[0]) {
    return 0;
  }

  if ((piecesA[0] > piecesB[0]) || !piecesB[1]) {
    return partialA;
  }

  if ((piecesB[0] > piecesA[0]) || !piecesA[1]) {
    return partialB;
  }
  return pack(piecesA[0], piecesA[1] + piecesB[1]);
}''' % (
    TIMESTAMP_PACK_FN,
    TIMESTAMP_UNPACK_FN,
)

# The post aggregate function is needed to remove the packed timestamp from the
# aggregation value and just return the summed value.
LAST_VALUE_POST_AGGREGATE_FN = (
    '''
function(value) {
  %s

  if (value == 0) {
    return value;
  }

  var unpacked = unpack(value);
  return unpack(value)[1];
}'''
    % TIMESTAMP_UNPACK_FN
)

LAST_VALUE_FORMULA = JSFormula(
    aggregate_fn=LAST_VALUE_AGGREGATE_FN,
    combine_fn=LAST_VALUE_COMBINE_FN,
    reset_fn=RESET_TO_ZERO_FN,
    post_aggregate_fn=LAST_VALUE_POST_AGGREGATE_FN,
)
