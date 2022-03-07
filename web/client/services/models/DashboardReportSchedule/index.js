// @flow
import * as Zen from 'lib/Zen';
import type { Serializable } from 'lib/Zen';

type Values = {
  authorName?: string,
  authorUsername?: string,
  dayOffset: string,
  id?: number,
  message: string,
  month?: string,
  cadence: string,
  recipients: $ReadOnlyArray<string>,
  shouldAttachPdf: boolean,
  shouldEmbedImage: boolean,
  subject: string,
  timeOfDay: string,
  useRecipientQueryPolicy: boolean,
  useSingleEmailThread: boolean,
  recipientUserGroups: $ReadOnlyArray<{
    name: string,
  }>,
};

type SerializedDashboardReportSchedule = Values;

class DashboardReportSchedule
  extends Zen.BaseModel<DashboardReportSchedule, Values>
  implements Serializable<$Shape<SerializedDashboardReportSchedule>> {
  static deserialize(
    values: SerializedDashboardReportSchedule,
  ): Zen.Model<DashboardReportSchedule> {
    return DashboardReportSchedule.create({
      ...values,
    });
  }

  serialize(): SerializedDashboardReportSchedule {
    const {
      dayOffset,
      id,
      message,
      month,
      cadence,
      recipients,
      shouldAttachPdf,
      shouldEmbedImage,
      subject,
      timeOfDay,
      useRecipientQueryPolicy,
      useSingleEmailThread,
      recipientUserGroups,
    } = this.modelValues();
    return {
      dayOffset,
      id,
      message,
      month,
      cadence,
      recipients,
      shouldAttachPdf,
      shouldEmbedImage,
      subject,
      timeOfDay,
      useRecipientQueryPolicy,
      useSingleEmailThread,
      recipientUserGroups,
    };
  }
}

export default ((DashboardReportSchedule: $Cast): Class<
  Zen.Model<DashboardReportSchedule>,
>);
