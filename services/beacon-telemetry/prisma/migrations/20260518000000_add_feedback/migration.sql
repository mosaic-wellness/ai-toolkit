CREATE TABLE "beacon_feedback" (
    "id" SERIAL PRIMARY KEY,
    "rating" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "user_email" VARCHAR(255) NOT NULL,
    "project_name" VARCHAR(255) NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "beacon_feedback_rating_idx" ON "beacon_feedback"("rating");
CREATE INDEX "beacon_feedback_ts_idx" ON "beacon_feedback"("ts");
