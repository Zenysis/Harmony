// @flow
import * as React from 'react';

import splitFormulaIntoTokens from 'components/DataCatalogApp/FieldDetailsPage/FieldCalculationSection/splitFormulaIntoTokens';
import { buildFieldDetailsPageLinkFromDatabaseId } from 'components/DataCatalogApp/buildFieldDetailsPageLink';
import type FormulaCalculation from 'models/core/wip/Calculation/FormulaCalculation';
import type { Token } from 'components/DataCatalogApp/FieldDetailsPage/FieldCalculationSection/splitFormulaIntoTokens';

type Props = {
  calculation: FormulaCalculation,
  className?: string,

  // If set, the user can navigate to the field details page by clicking on a
  // field in the formula.
  enableFieldClick?: boolean,
};

// Pretty print the formula text for a calculation.
export default function FormulaText({
  calculation,
  className = '',
  enableFieldClick = true,
}: Props): React.Node {
  const fieldIdToName = React.useMemo(() => {
    const output = {};
    calculation.constituents().forEach(constituent => {
      output[constituent.id()] = constituent.name();
    });
    return output;
  }, [calculation]);

  const tokens = React.useMemo(
    () => splitFormulaIntoTokens(calculation.expression()),
    [calculation],
  );

  function renderToken({ type, value }: Token, idx: number) {
    const key = `${value}-${idx}`;
    if (type === 'characters') {
      return (
        <div className="formula-text__token-characters" key={key}>
          {value}
        </div>
      );
    }

    const name = fieldIdToName[value] || value;
    if (!enableFieldClick) {
      return (
        <div className="formula-text__token-field" key={key}>
          {name}
        </div>
      );
    }

    // TODO(stephen): Should we allow clicking out to fields that do not have a
    // name mapped?
    // NOTE(stephen): The field ID stored inside the calculation is the
    // *database* field ID and not the globally unique relay ID.
    const url = buildFieldDetailsPageLinkFromDatabaseId(value, name);
    return (
      <a
        className="formula-text__token-field formula-text__token-field--link"
        href={url}
        key={key}
      >
        {name}
      </a>
    );
  }

  return (
    <div className={`formula-text ${className}`}>
      {tokens.map((token, idx) => renderToken(token, idx))}
    </div>
  );
}
