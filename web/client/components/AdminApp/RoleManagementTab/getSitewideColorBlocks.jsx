// @flow
import * as React from 'react';

/**
 * Returns color blocks, indicators for the level of sitewide access
 * a role has for dashboard and alert resources.
 */
export function getSitewideColorBlocks(
  sitewideItemRole: string,
): {
  view: React.Element<'div'>,
  edit: React.Element<'div'>,
  admin: React.Element<'div'>,
} {
  const role = sitewideItemRole.split('_')[1];
  const block = <div className="role-card__color-blocks" />;
  const coloredBlock = <div className="role-card__color-blocks--filled" />;

  if (role === 'admin') {
    return { view: coloredBlock, edit: coloredBlock, admin: coloredBlock };
  }
  if (role === 'editor') {
    return { view: coloredBlock, edit: coloredBlock, admin: block };
  }
  if (role === 'viewer') {
    return { view: coloredBlock, edit: block, admin: block };
  }
  return { view: block, edit: block, admin: block };
}
