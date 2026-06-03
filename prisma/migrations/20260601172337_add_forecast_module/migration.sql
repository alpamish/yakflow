-- CreateTable
CREATE TABLE "ForecastFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "originalName" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedById" TEXT,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "columnHeaders" TEXT NOT NULL,
    "changeSummary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ForecastFile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ForecastFile_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ForecastRow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "forecastFileId" TEXT NOT NULL,
    "voyageNumber" TEXT,
    "containerNumber" TEXT,
    "shipmentId" TEXT,
    "bookingRef" TEXT,
    "rowIndex" INTEGER NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ForecastRow_forecastFileId_fkey" FOREIGN KEY ("forecastFileId") REFERENCES "ForecastFile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ForecastChangeLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "forecastFileId" TEXT NOT NULL,
    "comparedToVersion" INTEGER NOT NULL,
    "changeType" TEXT NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "voyageNumber" TEXT,
    "containerNumber" TEXT,
    "shipmentId" TEXT,
    "bookingRef" TEXT,
    "rowIndex" INTEGER,
    "uploadedBy" TEXT NOT NULL,
    "uploadedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ForecastChangeLog_forecastFileId_fkey" FOREIGN KEY ("forecastFileId") REFERENCES "ForecastFile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ForecastChangeLog_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ForecastFile_organizationId_idx" ON "ForecastFile"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ForecastFile_organizationId_version_key" ON "ForecastFile"("organizationId", "version");

-- CreateIndex
CREATE INDEX "ForecastRow_forecastFileId_idx" ON "ForecastRow"("forecastFileId");

-- CreateIndex
CREATE INDEX "ForecastChangeLog_forecastFileId_idx" ON "ForecastChangeLog"("forecastFileId");
