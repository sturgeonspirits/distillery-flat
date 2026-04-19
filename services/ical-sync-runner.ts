import { syncIcalFeed } from "@/services/ical-import";
import {
  getActiveIcalSources,
  getIcalSourceById,
  markIcalSourceSyncError,
  markIcalSourceSyncSuccess,
} from "@/services/ical-sources";
import {
  createIcalSyncRun,
  finishIcalSyncRunError,
  finishIcalSyncRunSuccess,
} from "@/services/ical-sync-runs";

export async function syncIcalSourceWithMonitoring(
  sourceId: string,
  trigger: "manual" | "scheduled",
) {
  const source = await getIcalSourceById(sourceId);

  const run = await createIcalSyncRun({
    unit_id: source.unit_id,
    ical_source_id: source.id,
    source_name: source.source_name,
    trigger,
  });

  try {
    const result = await syncIcalFeed({
      unit_id: source.unit_id,
      source_name: source.source_name,
      feed_url: source.feed_url,
    });

    await markIcalSourceSyncSuccess({
      id: source.id,
      total_events: result.total_events,
      synced: result.synced,
      skipped: result.skipped,
    });

    await finishIcalSyncRunSuccess({
      id: run.id,
      total_events: result.total_events,
      synced: result.synced,
      skipped: result.skipped,
    });

    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown iCal sync error.";

    await markIcalSourceSyncError({
      id: source.id,
      error_message: message,
    });

    await finishIcalSyncRunError({
      id: run.id,
      error_message: message,
    });

    throw error;
  }
}

export async function syncAllActiveIcalSources(
  unit_id: string,
  trigger: "manual" | "scheduled",
) {
  const sources = await getActiveIcalSources(unit_id);

  let succeeded = 0;
  let failed = 0;

  for (const source of sources) {
    try {
      await syncIcalSourceWithMonitoring(source.id, trigger);
      succeeded += 1;
    } catch {
      failed += 1;
    }
  }

  return {
    total_sources: sources.length,
    succeeded,
    failed,
  };
}