-- CreateTable
CREATE TABLE "personas" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "personality" TEXT,
    "tone" TEXT,
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "responseStyle" TEXT,
    "activeHoursStart" INTEGER,
    "activeHoursEnd" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "personas_userId_key" ON "personas"("userId");
