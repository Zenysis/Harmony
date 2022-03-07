// @flow
import * as React from 'react';

import IndicatorCustomizationModuleBlock from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/IndicatorCustomizationModuleBlock';
import IndicatorDetailsSection from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/IndicatorAboutPanel/IndicatorDetailsSection';
import LabelWithTooltip from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/IndicatorAboutPanel/LabelWithTooltip';

type Props = {
  calculation: $PropertyType<
    React.ElementConfig<typeof IndicatorDetailsSection>,
    'calculation',
  >,
  category: $PropertyType<
    React.ElementConfig<typeof IndicatorDetailsSection>,
    'category',
  >,
  categoryPath: $PropertyType<
    React.ElementConfig<typeof IndicatorDetailsSection>,
    'categoryPath',
  >,
  dataSource: $PropertyType<
    React.ElementConfig<typeof IndicatorDetailsSection>,
    'dataSource',
  >,
  defaultName: $PropertyType<
    React.ElementConfig<typeof IndicatorDetailsSection>,
    'defaultName',
  >,
  description: $PropertyType<
    React.ElementConfig<typeof IndicatorDetailsSection>,
    'description',
  >,
  formulaDisplay?: React.Element<$AllowAny> | null,
};

const TEXT = t(
  'common.QueryBuilder.CustomizableIndicatorTag.IndicatorCustomizationModule.IndicatorAboutPanel',
);

export default function IndicatorAboutPanel({
  calculation,
  category,
  categoryPath,
  dataSource,
  defaultName,
  description,
  formulaDisplay = null,
}: Props): React.Node {
  return (
    <div className="indicator-about-panel">
      <IndicatorCustomizationModuleBlock title={TEXT.detailsSectionTitle}>
        <IndicatorDetailsSection
          calculation={calculation}
          category={category}
          categoryPath={categoryPath}
          dataSource={dataSource}
          defaultName={defaultName}
          description={description}
        />
      </IndicatorCustomizationModuleBlock>
      {!!formulaDisplay && (
        <IndicatorCustomizationModuleBlock
          className="indicator-about-panel__formula-section"
          title={TEXT.formulaSectionTitle}
        >
          <LabelWithTooltip
            label={TEXT.formulaItemLabel}
            labelClassName="indicator-about-panel__formula-label"
            popoverClassName="indicator-about-panel__formula-tooltip"
            tooltipContent={formulaDisplay}
          />
        </IndicatorCustomizationModuleBlock>
      )}
    </div>
  );
}
