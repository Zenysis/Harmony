// @flow
import * as React from 'react';
import invariant from 'invariant';

import I18N from 'lib/I18N';
import RequirementsCriteria from 'components/AdvancedQueryApp/LiveResultsView/VisualizationPicker/ExploreView/RequirementsCriteria';
import VisualizationPickerContext from 'components/AdvancedQueryApp/VisualizationPickerContext';
import { GROUPING_TAG_ICONS } from 'components/common/QueryBuilder/CustomizableGroupByTag';
import {
  VISUALIZATION_INFO,
  VISUALIZATION_REQUIREMENTS,
} from 'models/AdvancedQueryApp/VisualizationType/registry';
import type { IconType } from 'components/ui/Icon/types';
import type { VisualizationType } from 'models/AdvancedQueryApp/VisualizationType/types';

const REQUIREMENT_LABEL = {
  DIMENSION: I18N.textById('Group By'),
  GEOGRAPHY: I18N.text('Geography'),
  TIME: I18N.textById('Date'),
};

function getGroupingTagIconType(
  groupingType: 'DIMENSION' | 'GEOGRAPHY' | 'TIME',
): IconType | void {
  if (groupingType === 'GEOGRAPHY') {
    return GROUPING_TAG_ICONS.geography;
  }

  if (groupingType === 'TIME') {
    return GROUPING_TAG_ICONS.time;
  }

  return undefined;
}

type Props = {
  className: string,
  visualizationType: VisualizationType | void,
};

const defaultProps = {
  className: '',
  visualizationType: undefined,
};

/**
 * This component renders each of the requirement criteria for the hovered
 * or selected visualization, along with information on which criteria has
 * been satisfied or not. If a visualization has already been determined
 * and passed in, then that visualization will take precedent.
 */
export default function RequirementsDetails({
  className,
  visualizationType,
}: Props): React.Element<'div'> | null {
  const { vizRequirementsStatusMap } = React.useContext(
    VisualizationPickerContext,
  );

  if (visualizationType === undefined) {
    return null;
  }

  const vizName = VISUALIZATION_INFO[visualizationType].name;
  const requirements = VISUALIZATION_REQUIREMENTS[visualizationType];
  const reqsStatus = vizRequirementsStatusMap[visualizationType];

  const fieldCriteria = (
    <RequirementsCriteria
      max={requirements.field.max}
      min={requirements.field.min}
      requirementName={I18N.textById('Indicator')}
      requirementType="field"
      satisfied={reqsStatus.field.satisfied}
    />
  );

  const groupingCriteria =
    reqsStatus.grouping === undefined
      ? null
      : reqsStatus.grouping.map((group, i) => {
          invariant(requirements.grouping, 'There must be grouping criteria');
          const groupingRequirements = requirements.grouping;
          const { max, min, type } = groupingRequirements[i];
          return (
            <RequirementsCriteria
              key={type}
              groupingType={type}
              max={max}
              min={min}
              numGroupingRequirements={groupingRequirements.length}
              requirementName={REQUIREMENT_LABEL[type]}
              requirementType="grouping"
              satisfied={group.satisfied}
              tagIconType={getGroupingTagIconType(type)}
            />
          );
        });

  // NOTE: Need to bold the viz name insid the translation string.
  // Assuming that the vizName is already passed in the translated form.
  const header = I18N.text('The %(vizName)s requires:', { vizName });
  const idx = header.indexOf(vizName);
  const headerStart = header.slice(0, idx);
  const headerEnd = header.slice(idx + vizName.length);
  return (
    <div className={`aqt-explore-view-reqs-details ${className}`}>
      <p className="aqt-explore-view-reqs-details__header">
        {headerStart}
        <span className="aqt-explore-view-reqs-details__viz-name">
          {vizName}
        </span>
        {headerEnd}
      </p>
      {fieldCriteria}
      {groupingCriteria}
    </div>
  );
}

RequirementsDetails.defaultProps = defaultProps;
