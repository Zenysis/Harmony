// @flow
import * as React from 'react';

import Tag from 'components/ui/Tag';
import ZenArray from 'util/ZenModel/ZenArray';
import type Role from 'services/models/Role';
import type { TagMetadata } from 'components/AdminApp/UserProfileModal';

const NONE = t('admin_app.userProfileModal.none');

type Props = {
  roleTags: ZenArray<TagMetadata>,
};

export default function UserRoleDisplayTags(
  props: Props,
): string | Array<React.Element<Class<Tag<Role>>>> {
  const { roleTags } = props;
  if (roleTags.isEmpty()) {
    return NONE;
  }

  return roleTags.mapValues(tag => (
    <Tag
      key={tag.key}
      className="user-profile__tag"
      value={tag.value}
      size={Tag.Sizes.SMALL}
    >
      {tag.displayContents}
    </Tag>
  ));
}
