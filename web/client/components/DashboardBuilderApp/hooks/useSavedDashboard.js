// @flow
import * as React from 'react';

import DashboardService from 'services/DashboardBuilderApp/DashboardService';
import I18N from 'lib/I18N';
import Toaster from 'components/ui/Toaster';
import { IS_LEGACY_EXPERIENCE } from 'components/DashboardBuilderApp/constants';
import { cancelPromise } from 'util/promiseUtil';
import type Dashboard from 'models/core/Dashboard';

type LoadingStatus = 'error' | 'loading' | 'success';

/**
 * Load the saved dashboard from the backend and provide a way to save a new
 * dashboard in its place.
 */
export default function useSavedDashboard(
  dashboardURI: string,
): [Dashboard | void, (Dashboard) => void, LoadingStatus] {
  const [dashboard, setDashboard] = React.useState<Dashboard | void>(undefined);
  const [loadingStatus, setLoadingStatus] = React.useState('loading');

  // Load the dashboard from the backend.
  React.useEffect(() => {
    setLoadingStatus('loading');

    // HACK(stephen): If the user is in the legacy experience, we must change
    // the URL requested to include the special param.
    const fullURI = IS_LEGACY_EXPERIENCE
      ? `${dashboardURI}?legacy=1`
      : dashboardURI;
    const promise = DashboardService.getDashboardByUri(fullURI)
      .then(loadedDashboard => {
        setDashboard(loadedDashboard);
        setLoadingStatus('success');
      })
      .catch(error => {
        // NOTE(stephen): This does not implement the "fallback dashboard"
        // behavior that the current GridDashboardApp uses.
        Toaster.error(
          I18N.text(
            'There was an error retrieving and/or loading the Dashboard. Contact an Administrator for assistance. Details were written to the console.',
            'loadDashboardError',
          ),
        );
        console.error(error);
        setLoadingStatus('error');
      });
    return () => cancelPromise(promise);
  }, [dashboardURI]);

  // Save the new dashboard model to the backend.
  const onSaveDashboard = React.useCallback(newDashboard => {
    DashboardService.updateDashboard(newDashboard)
      .then(() => {
        setDashboard(newDashboard);
        Toaster.success(
          I18N.text(
            'Dashboard was successfully saved.',
            'saveDashboardSuccess',
          ),
        );
        analytics.track('Dashboard updated', {
          dashboardName: newDashboard.slug(),
          isOfficial: newDashboard.isOfficial(),
        });
      })
      .catch(error => {
        Toaster.error(
          I18N.text(
            'An error occurred while saving dashboard specification. Details were written to the console.',
            'saveDashboardError',
          ),
        );
        console.error(error);
      });
  }, []);

  // HACK(stephen): Certain CSS styles should only be applied in legacy mode
  // (like the text tile styles which are applied as CSS classes). To allow us
  // to differentiate legacy behavior *in SCSS*, and to avoid passing a `legacy`
  // flag too deeply in the DashboardContainer, we attach a class to the body
  // element. The class is being added to the body instead of the
  // DashboardContainer because modals are added to the DOM at the <body> level
  // and might still need to know about this styling (like in the text editing
  // experience).
  const legacyMode =
    dashboard === undefined || dashboard.specification().legacy();
  React.useEffect(() => {
    const { body } = document;
    if (!body) {
      return;
    }

    const legacyClassName = 'dashboard-legacy-mode';
    const modernClassName = 'dashboard-modern-mode';
    body.classList.add(legacyMode ? legacyClassName : modernClassName);
    body.classList.remove(legacyMode ? modernClassName : legacyClassName);
  }, [legacyMode]);

  return [dashboard, onSaveDashboard, loadingStatus];
}
