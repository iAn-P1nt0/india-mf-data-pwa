-- CreateTable
CREATE TABLE "schemes" (
    "id" SERIAL NOT NULL,
    "schemeCode" VARCHAR(10) NOT NULL,
    "schemeName" VARCHAR(500) NOT NULL,
    "amcName" VARCHAR(200),
    "schemeCategory" VARCHAR(200),
    "schemeType" VARCHAR(100),
    "isinGrowth" VARCHAR(20),
    "isinDividend" VARCHAR(20),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schemes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nav_history" (
    "id" BIGSERIAL NOT NULL,
    "schemeCode" VARCHAR(10) NOT NULL,
    "navDate" DATE NOT NULL,
    "navValue" DECIMAL(12,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nav_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schemes_schemeCode_key" ON "schemes"("schemeCode");

-- CreateIndex
CREATE INDEX "schemes_schemeCode_idx" ON "schemes"("schemeCode");

-- CreateIndex
CREATE INDEX "schemes_amcName_idx" ON "schemes"("amcName");

-- CreateIndex
CREATE INDEX "nav_history_schemeCode_navDate_idx" ON "nav_history"("schemeCode", "navDate" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "nav_history_schemeCode_navDate_key" ON "nav_history"("schemeCode", "navDate");

-- AddForeignKey
ALTER TABLE "nav_history" ADD CONSTRAINT "nav_history_schemeCode_fkey" FOREIGN KEY ("schemeCode") REFERENCES "schemes"("schemeCode") ON DELETE RESTRICT ON UPDATE CASCADE;

