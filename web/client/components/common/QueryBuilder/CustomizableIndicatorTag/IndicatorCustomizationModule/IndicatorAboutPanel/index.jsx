// @flow
import * as React from 'react';

import I18N from 'lib/I18N';
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
  fieldId: $PropertyType<
    React.ElementConfig<typeof IndicatorDetailsSection>,
    'fieldId',
  >,
  formulaDisplay?: React.Element<$AllowAny> | null,
};

export default function IndicatorAboutPanel({
  calculation,
  category,
  categoryPath,
  dataSource,
  defaultName,
  description,
  fieldId,
  formulaDisplay = null,
}: Props): React.Node {
  return (
    <div className="indicator-about-panel">
      <IndicatorCustomizationModuleBlock
        title={I18N.textById('Indicator Details')}
      >
        <IndicatorDetailsSection
          calculation={calculation}
          category={category}
          categoryPath={categoryPath}
          dataSource={dataSource}
          defaultName={defaultName}
          description={description}
          fieldId={fieldId}
        />
      </IndicatorCustomizationModuleBlock>
      {!!formulaDisplay && (
        <IndicatorCustomizationModuleBlock
          className="indicator-about-panel__formula-section"
          title={I18N.textById('Formula')}
        >
          <LabelWithTooltip
            label={I18N.text('Indicator has constituent parts')}
            labelClassName="indicator-about-panel__formula-label"
            popoverClassName="indicator-about-panel__formula-tooltip"
            tooltipContent={formulaDisplay}
          />
        </IndicatorCustomizationModuleBlock>
      )}
    </div>
  );
}
