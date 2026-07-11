ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "lastName" TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "doctorId" TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'Patient'
      AND column_name = 'fullName'
  ) THEN
    EXECUTE 'UPDATE "Patient"
      SET
        "firstName" = COALESCE(NULLIF(split_part("fullName", '' '', 1), ''''), ''Unknown''),
        "lastName" = COALESCE(NULLIF(regexp_replace("fullName", ''^\S+\s*'', ''''), ''''), ''Unknown'')
      WHERE "fullName" IS NOT NULL
        AND ("firstName" IS NULL OR "lastName" IS NULL)';
  END IF;
END $$;

UPDATE "Patient"
SET
  "firstName" = COALESCE("firstName", 'Unknown'),
  "lastName" = COALESCE("lastName", 'Unknown');

ALTER TABLE "Patient" ALTER COLUMN "firstName" SET NOT NULL;
ALTER TABLE "Patient" ALTER COLUMN "lastName" SET NOT NULL;
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "fullName";

CREATE INDEX IF NOT EXISTS "Patient_doctorId_idx" ON "Patient"("doctorId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Patient_doctorId_fkey'
  ) THEN
    ALTER TABLE "Patient"
    ADD CONSTRAINT "Patient_doctorId_fkey"
    FOREIGN KEY ("doctorId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
