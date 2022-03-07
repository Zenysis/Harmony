// @flow
import * as React from 'react';
import Promise from 'bluebird';
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import DashboardService from 'services/DashboardBuilderApp/DashboardService';
import QueryResultSpec from 'models/core/QueryResultSpec';
import QuerySelections from 'models/core/wip/QuerySelections';
import Toaster from 'components/ui/Toaster';
import useBoolean from 'lib/hooks/useBoolean';
import { localizeUrl } from 'components/Navbar/util';
import { maybeOpenNewTab } from 'util/util';
import type DashboardMeta from 'models/core/Dashboard/DashboardMeta';
import type { VisualizationType } from 'models/AdvancedQueryApp/VisualizationType/types';

type IsModalOpen = boolean;
type CloseModal = () => void;
type OpenModal = () => void;
type SaveToDashboardFunc = (
  dashboardSlug: string,
  dashboardToSaveTo: DashboardMeta | void,
) => Promise<void>;
type NavigateToDashboardFunc = (
  selectedDashboard: DashboardMeta,
  e: SyntheticMouseEvent<>,
) => void;
type Dashboards = Zen.Array<DashboardMeta>;

const TEXT = t('process_query');

export default function useSaveAQTQueryToDashboardModal(
  queryResultSpec: QueryResultSpec | void,
  querySelections: QuerySelections,
  visualizationType: VisualizationType | void,
): [
  IsModalOpen,
  CloseModal,
  OpenModal,
  SaveToDashboardFunc,
  NavigateToDashboardFunc,
  Dashboards,
] {
  const [isModalOpen, openModal, closeModal] = useBoolean(false);
  const [slugToDashboardMap, setSlugToDashboardMap] = React.useState<
    Zen.Map<DashboardMeta>,
  >(Zen.Map.create());

  React.useEffect(() => {
    // load the dashboards
    DashboardService.getEditableDashboards().then(dashboards =>
      setSlugToDashboardMap(Zen.Map.fromArray(dashboards, 'slug')),
    );
  }, []);

  const navigateToDashboard = React.useCallback(
    (selectedDash: DashboardMeta, e: SyntheticMouseEvent<>) => {
      maybeOpenNewTab(
        localizeUrl(`/dashboard/${selectedDash.slug()}`),
        e.metaKey,
      );
    },
    [],
  );

  const saveToDashboard = React.useCallback(
    (
      dashboardSlug: string,
      dashboardToSaveTo: DashboardMeta | void = undefined,
    ) => {
      // first do some validations
      if (dashboardSlug === '') {
        Toaster.error(t('query_result.save_query.dash_name_invalid'));
        return Promise.resolve();
      }

      const dashboard =
        dashboardToSaveTo || slugToDashboardMap.get(dashboardSlug);

      invariant(
        queryResultSpec,
        'Can only save query to a dashboard if queryResultSpec is non-void',
      );
      invariant(
        visualizationType,
        'We cannot save an undefined visualizationType',
      );
      invariant(dashboard, 'We cannot save to an undefined dashboard');

      // ok our dashboard and dashboard names are valid, so now we can finally
      // save the query to the dashboard
      return DashboardService.addQueryToDashboard(
        dashboard,
        querySelections,
        queryResultSpec,
        visualizationType,
      )
        .then(savedDashboard => {
          const dashboardMeta = savedDashboard.getDashboardMeta();

          // add the saved dashboard to our slugToDashboardMap
          setSlugToDashboardMap(prevSlugToDashboardMap =>
            prevSlugToDashboardMap.set(dashboardMeta.slug(), dashboardMeta),
          );
          Toaster.success(TEXT.addedToDashboard);
          analytics.track('Save Query to Dashboard', {
            dashboardName: dashboardSlug,
          });
        })
        .catch(error => {
          Toaster.error(error.message);
          console.error(error);
        });
    },
    [slugToDashboardMap, visualizationType, querySelections, queryResultSpec],
  );

  const dashboards = React.useMemo(() => slugToDashboardMap.zenValues(), [
    slugToDashboardMap,
  ]);

  return [
    isModalOpen,
    closeModal,
    openModal,
    saveToDashboard,
    navigateToDashboard,
    dashboards,
  ];
}
