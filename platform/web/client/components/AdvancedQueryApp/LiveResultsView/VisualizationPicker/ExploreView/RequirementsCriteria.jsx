// @flow
import * as React from 'react';
import classNames from 'classnames';

import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import QueryItemTag from 'components/common/QueryBuilder/QueryItemTag';
import type { IconType } from 'components/ui/Icon/types';

type Props = {
  // this should only be set if this is a 'grouping' requirement ('field'
  // requirements will have this prop as undefined)
  groupingType?: 'DIMENSION' | 'GEOGRAPHY' | 'TIME' | void,

  max: number | void,
  min: number,

  // this should only be set if this is a 'grouping' requirement. It holds
  // the total number of grouping requirements a visualization has.
  // This is used to determine if we might need to render 'Do not select'
  // or 'Do not select *additional*' group bys.
  numGroupingRequirements?: number | void,

  requirementName: string,
  requirementType: 'field' | 'grouping',
  satisfied: boolean,
  tagIconType: IconType | void,
};

const defaultProps = {
  tagIconType: undefined,
};

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
    criteria = I18N.text('%(min)s or more', { min });
  } else if (max === 0) {
    const notStringClass = classNames(
      'visualization-picker-reqs-criteria__not-string',
      {
        'visualization-picker-reqs-criteria__not-string--failed': !satisfied,
      },
    );

    criteria = (
      <span>
        {I18N.text('Do')}
        <span className={notStringClass}>{I18N.text('not')}</span>
        {I18N.text('select')}
        {groupingType === 'DIMENSION' && numGroupingRequirements > 1
          ? ` ${I18N.text('additional')}`
          : null}
      </span>
    );
  } else if (max === min) {
    criteria = min;
  } else {
    criteria = I18N.text('Between %(min)s and %(max)s', { max, min });
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
      <Icon className={iconClass} type={iconType} />{' '}
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
