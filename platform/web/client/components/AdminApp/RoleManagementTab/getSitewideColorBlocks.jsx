// @flow
import * as React from 'react';

/**
 * Returns color blocks, indicators for the level of sitewide access
 * a role has for dashboard and alert resources.
 */
export function getSitewideColorBlocks(
  sitewideItemRole: string,
): {
  admin: React.Element<'div'>,
  edit: React.Element<'div'>,
  view: React.Element<'div'>,
} {
  const role = sitewideItemRole.split('_')[1];
  const block = <div className="role-card__color-blocks" />;
  const coloredBlock = <div className="role-card__color-blocks--filled" />;

  if (role === 'admin') {
    return { admin: coloredBlock, edit: coloredBlock, view: coloredBlock };
  }
  if (role === 'editor') {
    return { admin: block, edit: coloredBlock, view: coloredBlock };
  }
  if (role === 'viewer') {
    return { admin: block, edit: block, view: coloredBlock };
  }
  return { admin: block, edit: block, view: block };
}
