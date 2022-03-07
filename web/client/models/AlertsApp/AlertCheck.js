// @flow
import * as Zen from 'lib/Zen';
import ComparativeCheck from 'models/AlertsApp/ComparativeCheck';
import ThresholdCheck from 'models/AlertsApp/ThresholdCheck';

export type AlertCheckMap = {
  THRESHOLD: ThresholdCheck,
  COMPARATIVE: ComparativeCheck,
};

export type AlertCheckType = $Keys<AlertCheckMap>;
export type AlertCheck = $Values<AlertCheckMap>;

export type SerializedAlertCheck =
  | Zen.Serialized<ThresholdCheck>
  | Zen.Serialized<ComparativeCheck>;

export function deserializeAlertChecks(
  valuesList: $ReadOnlyArray<SerializedAlertCheck>,
): Zen.Array<AlertCheck> {
  return Zen.Array.create(
    valuesList.map(values => {
      switch (values.type) {
        case 'THRESHOLD':
          return ThresholdCheck.deserialize(values);
        case 'COMPARATIVE':
          return ComparativeCheck.deserialize(values);
        default:
          (values.type: empty);
          throw new Error(
            `[Deserialize AlertCheck] Invalid type provided during deserialization: ${values.type}`,
          );
      }
    }),
  );
}
