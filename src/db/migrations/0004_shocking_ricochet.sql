ALTER TABLE "users" ADD COLUMN "is_chirpy_red" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "chirps" DROP COLUMN "is_chirpy_red";