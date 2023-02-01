/*
  Warnings:

  - You are about to drop the `Todo` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Condition" AS ENUM ('ACTIVE', 'INACTIVE', 'REQUESTED');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('DEFAULT', 'SILVER', 'GOLD', 'PLATINUM');

-- DropTable
DROP TABLE "Todo";

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "stripe_product_id" "Plan" NOT NULL DEFAULT 'DEFAULT'
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL,
    "subscription_id" TEXT,
    "customer_id" TEXT NOT NULL,
    "user_id" TEXT,
    "stripe_product_id" TEXT,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "adverts" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "type_value" TEXT NOT NULL,
    "board" TEXT NOT NULL,
    "board_value" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "model_value" TEXT NOT NULL,
    "year_model" INTEGER NOT NULL,
    "year_model_value" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "cep" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "doors" TEXT NOT NULL,
    "mileage" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "transmission" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "condition" "Condition" NOT NULL DEFAULT 'REQUESTED',
    "user_id" TEXT,

    CONSTRAINT "adverts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "optional" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "optional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photos" (
    "id" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "uri" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "advert_id" TEXT NOT NULL,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AdvertsToOptional" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "user_id_key" ON "user"("id");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_id_key" ON "subscriptions"("id");

-- CreateIndex
CREATE UNIQUE INDEX "optional_id_key" ON "optional"("id");

-- CreateIndex
CREATE UNIQUE INDEX "optional_name_key" ON "optional"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_AdvertsToOptional_AB_unique" ON "_AdvertsToOptional"("A", "B");

-- CreateIndex
CREATE INDEX "_AdvertsToOptional_B_index" ON "_AdvertsToOptional"("B");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adverts" ADD CONSTRAINT "adverts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_advert_id_fkey" FOREIGN KEY ("advert_id") REFERENCES "adverts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AdvertsToOptional" ADD CONSTRAINT "_AdvertsToOptional_A_fkey" FOREIGN KEY ("A") REFERENCES "adverts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AdvertsToOptional" ADD CONSTRAINT "_AdvertsToOptional_B_fkey" FOREIGN KEY ("B") REFERENCES "optional"("id") ON DELETE CASCADE ON UPDATE CASCADE;
