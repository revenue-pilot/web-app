-- CreateTable
CREATE TABLE "PlanLimit" (
    "id" TEXT NOT NULL,
    "tier" "PlanTier" NOT NULL,
    "maxCampaigns" INTEGER NOT NULL DEFAULT 1,
    "maxUsers" INTEGER NOT NULL DEFAULT 1,
    "maxAdAccounts" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanLimit_tier_key" ON "PlanLimit"("tier");
