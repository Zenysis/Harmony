// @flow
import * as React from 'react';
import classNames from 'classnames';

import Icon from 'components/ui/Icon';
import QueryItemTag from 'components/common/QueryBuilder/QueryItemTag';
import type { IconType } from 'components/ui/Icon/types';

type Props = {
  max: number | void,
  min: number,
  requirementName: string,
  requirementType: 'field' | 'grouping',
  satisfied: boolean,
  tagIconType: IconType | void,

  // this should only be set if this is a 'grouping' requirement ('field'
  // requirements will have this prop as undefined)
  groupingType?: 'DIMENSION' | 'GEOGRAPHY' | 'TIME' | void,

  // this should only be set if this is a 'grouping' requirement. It holds
  // the total number of grouping requirements a visualization has.
  // This is used to determine if we might need to render 'Do not select'
  // or 'Do not select *additional*' group bys.
  numGroupingRequirements?: number | void,
};

const defaultProps = {
  tagIconType: undefined,
};

const TEXT_PATH =
  'AdvancedQueryApp.LiveResultsView.VisualizationPicker.ExploreView.RequirementsCriteria';

export default function RequirementsCriteria({
  max,
  min,
  requirementName,
  requirementType,
  satisfied,
  tagIconType,
  groupingType = undefined,
  numGroupingRequirements = undefined,
}: Props): React.Element<'div'> {
  let criteria;
  if (max === undefined) {
    criteria = t('unboundedMax', { min, scope: TEXT_PATH });
  } else if (max === 0) {
    const doStr = t(TEXT_PATH).notRequired.do;
    const { not, select, additional } = t(TEXT_PATH).notRequired;

    const notStringClass = classNames(
      'visualization-picker-reqs-criteria__not-string',
      {
        'visualization-picker-reqs-criteria__not-string--failed': !satisfied,
      },
    );

    criteria = (
      <span>
        {doStr}
        <span className={notStringClass}>{not}</span>
        {select}
        {groupingType === 'DIMENSION' && numGroupingRequirements > 1
          ? ` ${additional}`
          : null}
      </span>
    );
  } else if (max === min) {
    criteria = t('exactNum', { num: min, scope: TEXT_PATH });
  } else {
    criteria = t('range', { min, max, scope: TEXT_PATH });
  }

  const iconType = satisfied ? 'ok' : 'remove';
  const iconClass = classNames(
    'visualization-picker-reqs-criteria__criteria-icon',
    {
      'visualization-picker-reqs-criteria__criteria-icon--failed': !satisfied,
      'visualization-picker-reqs-criteria__criteria-icon--satisfied': satisfied,
    },
  );

  const mainDivClassName = classNames(
    'visualization-picker-reqs-criteria',
    `visualization-picker-reqs-criteria--${requirementType}-requirement`,
    'u-paragraph-text',
  );

  const tagClassName = classNames('visualization-picker-reqs-criteria__tag', {
    'visualization-picker-reqs-criteria__tag--no-icon':
      tagIconType === undefined,
  });

  return (
    <div className={mainDivClassName}>
      <Icon type={iconType} className={iconClass} />{' '}
      <span className="visualization-picker-reqs-criteria__criteria-text">
        {criteria}
      </span>
      <QueryItemTag
        className={tagClassName}
        disabled
        iconType={tagIconType}
        item={undefined}
        removable={false}
        text={requirementName}
      />
    </div>
  );
}

RequirementsCriteria.defaultProps = defaultProps;
