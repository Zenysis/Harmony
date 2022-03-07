// @flow
import * as React from 'react';
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';

export default function() {}

export function loadCaseManagementInfo(){
	return Promise.resolve({
		allDruidCaseTypes: Zen.Map.create(),
		canUserViewCaseManagement: false,
	})
}
