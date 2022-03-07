// @flow
import * as React from 'react';

import BaseModal from 'components/ui/BaseModal';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';

type Props = {
  onRequestClose: () => void,
  showModal: boolean,
};

export default function MappingFileSummaryModal({
  onRequestClose,
  showModal,
}: Props): React.Node {
  return (
    <BaseModal
      closeButtonText="Close"
      onRequestClose={onRequestClose}
      show={showModal}
      showPrimaryButton={false}
      title="Explanation: standard mapping file CSV structure"
    >
      <Group.Vertical spacing="s">
        <p>
          All mapping CSVs adhere to a strict header structure. All headers
          should adhere to the following pattern:
        </p>
        <div className="code-block">
          <code>
            ParentDimension2 | ParentDimension1 | GeoDimension | GeoDimensionLat
            | GeoDimensionLon | match_0 | match_1 | .....
          </code>
        </div>
        <p>
          The first columns always correspond to the geographic hierarchy
          dimensions. For example, if your country has a hierarchy of Province
          &gt; District &gt; Facility, then <code>province_mapped.csv</code>{' '}
          could look like:
        </p>
        <div className="code-block">
          <code>
            Province | ProvinceLat | ProvinceLon | match_0 | match_1 | ...
          </code>
        </div>
        <p>
          But <code>facility_mapped.csv</code> would look like:
        </p>
        <div className="code-block">
          <code>
            Province | District | Facility | FacilityLat | FacilityLon | match_0
            | match_1 | ...
          </code>
        </div>
        <p>
          The key distinction here is the inclusion of parent dimensions. Notice
          how in the <code>province_mapped.csv</code> example there are no
          parent dimensions, because there is no hierarchy above a Province. But
          in <code>facility_mapped.csv</code>, we had to include the Province
          and District columns.
        </p>
        <p>
          Finally, at the end there are any number of <code>match_x</code>{' '}
          columns, starting from <code>match_0</code>. Each of these columns
          represents a different way a location could have been spelled.
        </p>
        <Heading size={Heading.Sizes.SMALL}>
          Adding new matches for a location
        </Heading>
        <p>
          To add a new type of location match, just add it to the first empty{' '}
          <code>match</code> column available for that row. If a location has
          lots of matches, it might look like you ran out of <code>match</code>{' '}
          columns. For example, maybe the CSV file only went up to{' '}
          <code>match_4</code>, but you need to add another possible match for a
          location. In this case, you can add another <code>match</code> column
          — just make sure you number it correctly. If the last column was{' '}
          <code>match_4</code>, then the new column you add should be{' '}
          <code>match_5</code>.
        </p>
      </Group.Vertical>
    </BaseModal>
  );
}
