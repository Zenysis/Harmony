// @flow
import * as React from 'react';
import PapaParse from 'papaparse';

import Alert from 'components/ui/Alert';
import Card from 'components/ui/Card';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import Moment from 'models/core/wip/DateTime/Moment';
import UploadInput from 'components/ui/UploadInput';

type ColumnRuleResult = {
  errorMessage: string,
  value: string,
};

type ColumnRuleResultCollection = {
  errorMessage: string,
  values: $ReadOnlyArray<string>,
};

export function dateIsValidFormat(date: string): ColumnRuleResult | void {
  const dateFormat = 'YYYY-MM-DD';
  const toDateFormat = new Moment(new Date(date)).format(dateFormat);
  const dateIsValid =
    new Moment(toDateFormat, dateFormat, true).isValid() &&
    date.length === dateFormat.length;
  return !dateIsValid
    ? { errorMessage: `Date format does not match ${dateFormat}`, value: date }
    : undefined;
}

type Props = {
  /**
   * Comment / Phrase to use for parts of the header
   * that are extra and have no rules associated with them,
   * ie match columns and extra dimensions.
   */
  extraColumnsHeading: string,

  /**  Columns that Must exist in the header verbatim */
  mandatoryColumns: $ReadOnlyArray<string>,

  /** Columns that are associated with the geographical area of the deployment */
  hierarchyColumns?: $ReadOnlyArray<string>,

  columnRules?: {
    [columnName: string]: (cellData: string) => ColumnRuleResult | void,
  },
};

const HIERARCHY_COLUMNS = window.__JSON_FROM_BACKEND.geoFieldOrdering;
const ROW_SAMPLE_SIZE = 15;

// NOTE(moriah): This sets the chunk size in bytes of the file
// that papaparse reads in. We are currently just reading in the first chunk.
PapaParse.LocalChunkSize = 1000;

export default function CsvHeaderValidator({
  extraColumnsHeading,
  mandatoryColumns,
  hierarchyColumns = HIERARCHY_COLUMNS,
  columnRules = {},
}: Props): React.Node {
  const [
    validationCardIsVisible,
    setValidationCardVisibility,
  ] = React.useState<boolean>(false);
  const [successfulColumns, setSuccessfulColumns] = React.useState<
    $ReadOnlyArray<string>,
  >([]);
  const [missingColumns, setMissingColumns] = React.useState<
    $ReadOnlyArray<string>,
  >([]);
  const [emptyColumns, setEmptyColumns] = React.useState<
    $ReadOnlyArray<string>,
  >([]);
  const [dimensionColumns, setDimensionColumns] = React.useState<
    $ReadOnlyArray<string>,
  >([]);
  // NOTE(isabel): columnRuleErrors type will need to change to support multiple rules for a single column
  const [columnRuleErrors, setColumnRuleErrors] = React.useState<{
    [columnName: string]: ColumnRuleResultCollection,
    ...,
  }>({});

  const validateHeader = (header: $ReadOnlyArray<string>) => {
    const successful = [];
    const dimension = [];
    const empty = [];
    const baseHeader = new Set(mandatoryColumns);

    header.forEach(cell => {
      if (!cell.length) {
        empty.push(cell);
      } else if (baseHeader.has(cell)) {
        // If it is in the mandatory columns prop then add it to the successful
        baseHeader.delete(cell);
        successful.push(cell);
      } else {
        // If its not a mandatory column add it to the dimensions
        dimension.push(cell);
      }
    });

    setMissingColumns(Array.from(baseHeader));
    setDimensionColumns(dimension);
    setSuccessfulColumns(successful);
    setEmptyColumns(empty);
  };

  const applyColumnRules = results => {
    if (Object.keys(columnRules).length > 0) {
      const errors = {};
      const { data } = results;
      // Process all of the data in the chunk or the ROW_SAMPLE_SIZE
      // whichever is smaller.
      const sampleSize = Math.min(ROW_SAMPLE_SIZE, data.length);
      Object.keys(columnRules).forEach(columnName => {
        if (results.meta.fields.includes(columnName)) {
          const violatingColumnValues = [];
          let ruleError;
          for (let i = 0; i < sampleSize; i++) {
            const ruleResult = columnRules[columnName](data[i][columnName]);
            if (ruleResult) {
              ruleError = `Column "${columnName}": ${ruleResult.errorMessage}`;
              violatingColumnValues.push(ruleResult.value);
            }
          }
          if (violatingColumnValues.length > 0) {
            errors[columnName] = {
              errorMessage: ruleError,
              values: violatingColumnValues,
            };
          }
        }
      });
      setColumnRuleErrors(errors);
    }
  };

  const csvReaderChunk = (results, parser) => {
    validateHeader(results.meta.fields);
    applyColumnRules(results);

    setValidationCardVisibility(true);

    parser.abort();
  };

  const parseUploadedFile = (file: File): void => {
    const reader = new window.FileReader();
    reader.onload = (event): void => {
      PapaParse.parse(event.target.result, {
        chunk: csvReaderChunk,
        chunkSize: 40000,
        header: true,
      });
    };
    reader.readAsText(file, 'utf-8');
  };

  const onFileChange = (e: SyntheticEvent<HTMLInputElement>): void => {
    if (e.target instanceof HTMLInputElement) {
      const [file] = e.target.files;
      parseUploadedFile(file);
    }
  };

  const onFileDrop = (e: DragEvent): void => {
    if (e.dataTransfer) {
      const [file] = e.dataTransfer.files;
      parseUploadedFile(file);
    }
  };

  const columnRuleAlertTitle = (
    errorInfo: ColumnRuleResultCollection,
  ): string => `${errorInfo.errorMessage}: (${errorInfo.values.join(', ')})`;

  const columnRuleAlerts = Object.keys(columnRuleErrors).map(columnName => (
    <Alert
      id={columnName}
      key={columnName}
      title={columnRuleAlertTitle(columnRuleErrors[columnName])}
      intent="error"
      tooltipText="Column rule error"
    />
  ));

  const dimensionColumnsAlert = dimensionColumns.map(name => (
    <Alert
      id={name}
      title={name}
      key={name}
      intent={hierarchyColumns.includes(name) ? 'success' : 'none'}
      tooltipText={
        hierarchyColumns.includes(name)
          ? 'Geographic hierarchy column detected'
          : 'Non-geographic hierarchy column detected'
      }
    />
  ));

  const emptyColumnsAlert = emptyColumns.length ? (
    <Alert
      intent="warning"
      title={`File header contains ${emptyColumns.length} unnamed/empty columns`}
      tooltipText="Empty column detected"
    />
  ) : null;

  const missingColumnsAlert = missingColumns.map(name => (
    <Alert
      id={name}
      title={name}
      key={name}
      intent="error"
      tooltipText="Required column missing"
    />
  ));

  const successfulColumnsAlert = successfulColumns.map(name => (
    <Alert
      id={name}
      title={name}
      key={name}
      intent="success"
      tooltipText="Required column detected"
    />
  ));

  const cardBackgroundColor =
    missingColumns.length || columnRuleAlerts.length
      ? Card.HeadingColors.RED
      : Card.HeadingColors.GREEN;

  return (
    <>
      <UploadInput
        accept=".csv"
        onChange={onFileChange}
        onFileDrop={onFileDrop}
      />
      {validationCardIsVisible ? (
        <Card
          title="Header validation results"
          headingBackground={cardBackgroundColor}
        >
          <Group.Vertical spacing="m">
            {columnRuleAlerts.length ? (
              <>
                <Heading.Small underlined>
                  The following columns rules were violated
                </Heading.Small>
                <div>{columnRuleAlerts}</div>
              </>
            ) : null}
            <Heading.Small underlined>
              The following columns are required
            </Heading.Small>
            <div>
              {successfulColumnsAlert}
              {missingColumnsAlert}
            </div>
            <Heading.Small underlined>
              {`The following columns will be used as ${extraColumnsHeading}`}
            </Heading.Small>
            <div>{dimensionColumnsAlert}</div>
            {emptyColumnsAlert}
          </Group.Vertical>
        </Card>
      ) : null}
    </>
  );
}
