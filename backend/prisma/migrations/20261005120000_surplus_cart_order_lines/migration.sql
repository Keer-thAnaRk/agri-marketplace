-- Surplus cart/order line identity so flash-offer prices are not overwritten by product list price.

ALTER TABLE "CartItem" ADD COLUMN "lineKey" TEXT;
ALTER TABLE "CartItem" ADD COLUMN "surplusOfferId" TEXT;

UPDATE "CartItem" SET "lineKey" = "productId" WHERE "lineKey" IS NULL;

ALTER TABLE "CartItem" ALTER COLUMN "lineKey" SET NOT NULL;

DROP INDEX IF EXISTS "CartItem_userId_productId_key";

CREATE UNIQUE INDEX "CartItem_userId_lineKey_key" ON "CartItem"("userId", "lineKey");
CREATE INDEX "CartItem_surplusOfferId_idx" ON "CartItem"("surplusOfferId");

ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_surplusOfferId_fkey" FOREIGN KEY ("surplusOfferId") REFERENCES "SurplusOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrderItem" ADD COLUMN "surplusOfferId" TEXT;
CREATE INDEX "OrderItem_surplusOfferId_idx" ON "OrderItem"("surplusOfferId");
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_surplusOfferId_fkey" FOREIGN KEY ("surplusOfferId") REFERENCES "SurplusOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
