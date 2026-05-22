CREATE TABLE "beacon_events" (
    "id" SERIAL PRIMARY KEY,
    "command" VARCHAR(50) NOT NULL,
    "user_email" VARCHAR(255) NOT NULL,
    "project_name" VARCHAR(255) NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "beacon_events_command_idx" ON "beacon_events"("command");
CREATE INDEX "beacon_events_user_email_idx" ON "beacon_events"("user_email");
CREATE INDEX "beacon_events_ts_idx" ON "beacon_events"("ts");
