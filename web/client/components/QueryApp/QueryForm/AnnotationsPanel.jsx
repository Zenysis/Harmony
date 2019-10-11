// @flow
import React from 'react';

import Card from 'components/ui/Card';
import { GroupLookup, IndicatorLookup } from 'indicator_fields';
import type Field from 'models/core/Field';

type Props = {
  fields: $ReadOnlyArray<Field>,
  title: string,
  indicatorAnnotations: boolean,
};

const defaultProps = {
  indicatorAnnotations: false,
};

function maybeRenderInfo(texts: Set<string>) {
  if (texts.size === 0) {
    return null;
  }

  return Array.from(texts).map(text => (
    <div key={text} className="query-health-indicator">
      <div className="query-health-indicator__title">{text}</div>
    </div>
  ));
}

function renderIndicatorInfo(fields: $ReadOnlyArray<Field>) {
  // Display the indicator-level definition for every indicator that
  // is used by this query that has a definition.
  const texts = new Set();
  fields.forEach(field => {
    const fieldId = field.id();
    if (!Object.prototype.hasOwnProperty.call(IndicatorLookup, fieldId)) {
      return;
    }
    const fieldInfo = IndicatorLookup[fieldId];
    if (fieldInfo.definition) {
      texts.add(`${fieldInfo.text} ${fieldInfo.definition}`);
    }
  });
  return maybeRenderInfo(texts);
}

function renderGroupInfo(fields: $ReadOnlyArray<Field>) {
  // Display the group-level annotation for every group that is used by this
  // query.
  const texts = new Set();
  fields.forEach(field => {
    const fieldId = field.id();
    if (!Object.prototype.hasOwnProperty.call(IndicatorLookup, fieldId)) {
      return;
    }
    const group = GroupLookup[IndicatorLookup[fieldId].groupId];
    if (group.annotation) {
      texts.add(`${group.groupText}: ${group.annotation}`);
    }
  });

  return maybeRenderInfo(texts);
}

export default function AnnotationsPanel(props: Props) {
  const renderedInfo = props.indicatorAnnotations
    ? renderIndicatorInfo(props.fields)
    : renderGroupInfo(props.fields);
  if (!renderedInfo || renderedInfo.length === 0) {
    return null;
  }

  return (
    <Card
      title={props.title}
      className="query-form-selections-panel"
      headingBackground="offwhite"
    >
      {renderedInfo}
    </Card>
  );
}

AnnotationsPanel.defaultProps = defaultProps;
