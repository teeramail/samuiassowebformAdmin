ALTER TABLE "registrations"
	ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE OR REPLACE FUNCTION set_updated_at()
	RETURNS trigger
	LANGUAGE plpgsql
	AS $$
	BEGIN
		NEW."updated_at" = now();
		RETURN NEW;
	END;
	$$;--> statement-breakpoint
DROP TRIGGER IF EXISTS registrations_updated_at ON "registrations";--> statement-breakpoint
CREATE TRIGGER registrations_updated_at
	BEFORE UPDATE ON "registrations"
	FOR EACH ROW
	EXECUTE FUNCTION set_updated_at();
