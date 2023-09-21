// @flow
import * as React from 'react';

import Group from 'components/ui/Group';
import I18N from 'lib/I18N';

export default function BaseRowDescription(): React.Node {
  const captionTextClassName = 'data-upload-fileinput__caption-text';
  const descriptionTextClassName = 'data-upload-fileinput__description-text';

  return (
    <Group.Vertical
      className="data-upload-fileinput__description"
      paddingLeft="l"
      spacing="xxs"
    >
      <Group.Item className={descriptionTextClassName} marginBottom="m">
        <I18N>
          In order to successfully ingest your data into our database, data must
          be in the Zenysis Base Format:
        </I18N>
      </Group.Item>
      <Group.Item
        className="data-upload-fileinput__description-example"
        marginBottom="m"
      >
        <I18N id="file-upload-example">
          groupby 1, groupby 2, ..., groupbyN, date, indicator 1, indicator 2,
          ..., indicatorN
        </I18N>
      </Group.Item>
      <Group.Item className={captionTextClassName}>
        <I18N id="dateFormatDescription">
          Dates must be in the format YYYY-MM-DD (eg. 2021-01-30).
        </I18N>
      </Group.Item>
      <Group.Item className={captionTextClassName}>
        <I18N id="indicatorFormatDescription">
          Indicators must have only numerical or empty values.
        </I18N>
      </Group.Item>
      <Group.Item flex>
        <a
          className="data-upload-fileinput__learn-more-link"
          href="https://github.com/Zenysis/Harmony#formatting-data-for-ingestion"
          rel="noreferrer noopener"
          target="_blank"
        >
          <I18N>Learn More</I18N>
        </a>
      </Group.Item>
    </Group.Vertical>
  );
}
