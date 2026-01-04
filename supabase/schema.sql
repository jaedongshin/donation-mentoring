


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "password" "text",
    "reset_token" "text",
    "reset_token_expires" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admins" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_by_email"("email_input" "text", "p_secret" "text") RETURNS SETOF "public"."admins"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not exists (select 1 from public.app_config where key = 'API_SECRET' and value = p_secret) then
    raise exception 'Unauthorized';
  end if;
  return query select * from public.admins where email = email_input;
end;
$$;


ALTER FUNCTION "public"."get_admin_by_email"("email_input" "text", "p_secret" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_by_reset_token"("p_token" "text", "p_secret" "text") RETURNS SETOF "public"."admins"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not exists (select 1 from public.app_config where key = 'API_SECRET' and value = p_secret) then
    raise exception 'Unauthorized';
  end if;
  return query select * from public.admins 
  where reset_token = p_token 
  and reset_token_expires > now();
end;
$$;


ALTER FUNCTION "public"."get_admin_by_reset_token"("p_token" "text", "p_secret" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_admin_password"("p_id" "uuid", "p_hash" "text", "p_secret" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not exists (select 1 from public.app_config where key = 'API_SECRET' and value = p_secret) then
    raise exception 'Unauthorized';
  end if;
  update public.admins
  set password = p_hash,
      reset_token = null,
      reset_token_expires = null
  where id = p_id;
end;
$$;


ALTER FUNCTION "public"."update_admin_password"("p_id" "uuid", "p_hash" "text", "p_secret" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_admin_reset_token"("p_email" "text", "p_token" "text", "p_expires" timestamp with time zone, "p_secret" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not exists (select 1 from public.app_config where key = 'API_SECRET' and value = p_secret) then
    raise exception 'Unauthorized';
  end if;
  update public.admins
  set reset_token = p_token,
      reset_token_expires = p_expires
  where email = p_email;
end;
$$;


ALTER FUNCTION "public"."update_admin_reset_token"("p_email" "text", "p_token" "text", "p_expires" timestamp with time zone, "p_secret" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_config" (
    "key" "text" NOT NULL,
    "value" "text" NOT NULL
);


ALTER TABLE "public"."app_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mentors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name_en" character varying(255) NOT NULL,
    "location_en" character varying(255) NOT NULL,
    "description_en" "text" NOT NULL,
    "name_ko" character varying(255) NOT NULL,
    "location_ko" character varying(255) NOT NULL,
    "description_ko" "text" NOT NULL,
    "picture_url" "text",
    "tags" "jsonb" DEFAULT '[]'::"jsonb",
    "display_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "position_en" "text",
    "position_ko" "text",
    "linkedin_url" "text",
    "calendly_url" "text",
    "company_en" "text",
    "company_ko" "text",
    "email" "text",
    "languages" "text"[],
    "session_time_minutes" integer,
    "session_price_usd" numeric(10,2)
);


ALTER TABLE "public"."mentors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "review" character varying
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


ALTER TABLE "public"."reviews" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."reviews_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_config"
    ADD CONSTRAINT "app_config_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."mentors"
    ADD CONSTRAINT "mentors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_mentors_active" ON "public"."mentors" USING "btree" ("is_active");



CREATE INDEX "idx_mentors_created_at" ON "public"."mentors" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_mentors_display_order" ON "public"."mentors" USING "btree" ("display_order");



CREATE OR REPLACE TRIGGER "update_mentors_updated_at" BEFORE UPDATE ON "public"."mentors" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE POLICY "Enable delete access for all users" ON "public"."mentors" FOR DELETE USING (true);



CREATE POLICY "Enable insert access for all users" ON "public"."mentors" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."mentors" FOR SELECT USING (true);



CREATE POLICY "Enable update access for all users" ON "public"."mentors" FOR UPDATE USING (true);



ALTER TABLE "public"."admins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mentors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TABLE "public"."admins" TO "anon";
GRANT ALL ON TABLE "public"."admins" TO "authenticated";
GRANT ALL ON TABLE "public"."admins" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_by_email"("email_input" "text", "p_secret" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_by_email"("email_input" "text", "p_secret" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_by_email"("email_input" "text", "p_secret" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_by_reset_token"("p_token" "text", "p_secret" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_by_reset_token"("p_token" "text", "p_secret" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_by_reset_token"("p_token" "text", "p_secret" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_admin_password"("p_id" "uuid", "p_hash" "text", "p_secret" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_admin_password"("p_id" "uuid", "p_hash" "text", "p_secret" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_admin_password"("p_id" "uuid", "p_hash" "text", "p_secret" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_admin_reset_token"("p_email" "text", "p_token" "text", "p_expires" timestamp with time zone, "p_secret" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_admin_reset_token"("p_email" "text", "p_token" "text", "p_expires" timestamp with time zone, "p_secret" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_admin_reset_token"("p_email" "text", "p_token" "text", "p_expires" timestamp with time zone, "p_secret" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."app_config" TO "anon";
GRANT ALL ON TABLE "public"."app_config" TO "authenticated";
GRANT ALL ON TABLE "public"."app_config" TO "service_role";



GRANT ALL ON TABLE "public"."mentors" TO "anon";
GRANT ALL ON TABLE "public"."mentors" TO "authenticated";
GRANT ALL ON TABLE "public"."mentors" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON SEQUENCE "public"."reviews_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."reviews_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."reviews_id_seq" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







RESET ALL;
