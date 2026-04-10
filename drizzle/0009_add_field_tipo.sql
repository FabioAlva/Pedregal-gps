ALTER TABLE "campos" ADD COLUMN "tipo" text DEFAULT 'GUIA';
--> statement-breakpoint
UPDATE "campos" SET "tipo" = 'GUIA' WHERE "tipo" IS NULL;
--> statement-breakpoint
ALTER TABLE "campos" ALTER COLUMN "tipo" SET NOT NULL;
