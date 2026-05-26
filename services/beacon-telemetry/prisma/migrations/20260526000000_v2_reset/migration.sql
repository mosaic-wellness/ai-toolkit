-- v2 reset: drop legacy tables and recreate with the new schema.

DROP TABLE IF EXISTS "beacon_events";
DROP TABLE IF EXISTS "beacon_feedback";

CREATE TABLE "beacon_events" (
    "id" SERIAL NOT NULL,
    "plugin" VARCHAR(32) NOT NULL,
    "plugin_version" VARCHAR(32),
    "event_type" VARCHAR(32) NOT NULL,
    "command" VARCHAR(32),
    "subcommand" VARCHAR(80) NOT NULL DEFAULT '',
    "user_local" VARCHAR(64) NOT NULL,
    "project" VARCHAR(96) NOT NULL,
    "session_id" VARCHAR(64),
    "os" VARCHAR(16),
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "beacon_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "beacon_events_plugin_idx" ON "beacon_events"("plugin");
CREATE INDEX "beacon_events_event_type_idx" ON "beacon_events"("event_type");
CREATE INDEX "beacon_events_user_local_idx" ON "beacon_events"("user_local");
CREATE INDEX "beacon_events_session_id_idx" ON "beacon_events"("session_id");
CREATE INDEX "beacon_events_ts_idx" ON "beacon_events"("ts");

CREATE TABLE "beacon_feedback" (
    "id" SERIAL NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "user_local" VARCHAR(64) NOT NULL,
    "project" VARCHAR(96) NOT NULL,
    "plugin_version" VARCHAR(32),
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "beacon_feedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "beacon_feedback_rating_idx" ON "beacon_feedback"("rating");
CREATE INDEX "beacon_feedback_ts_idx" ON "beacon_feedback"("ts");
