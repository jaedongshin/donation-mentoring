-- Allow nullable fields for mentors to support partial signup
ALTER TABLE "public"."mentors" ALTER COLUMN "name_en" DROP NOT NULL;
ALTER TABLE "public"."mentors" ALTER COLUMN "location_en" DROP NOT NULL;
ALTER TABLE "public"."mentors" ALTER COLUMN "description_en" DROP NOT NULL;
ALTER TABLE "public"."mentors" ALTER COLUMN "name_ko" DROP NOT NULL;
ALTER TABLE "public"."mentors" ALTER COLUMN "location_ko" DROP NOT NULL;
ALTER TABLE "public"."mentors" ALTER COLUMN "description_ko" DROP NOT NULL;
