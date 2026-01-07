


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


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_role TEXT := 'user';
BEGIN
    -- Auto-promote only mulli2@gmail.com as admin
    IF NEW.email = 'mulli2@gmail.com' THEN
        user_role := 'admin';
    END IF;

    -- Create profile with mentor_id = NULL
    -- User will link via dashboard UI (with email match pre-selected in dropdown)
    INSERT INTO public.profiles (id, email, display_name, avatar_url, role, mentor_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url',
        user_role,
        NULL  -- Never auto-link - user must explicitly choose in dashboard
    );

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_profiles_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_profiles_updated_at"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."validate_role_change"("target_user_id" "uuid", "new_role" "text", "current_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    current_user_role TEXT;
BEGIN
    -- Get current user's role
    SELECT role INTO current_user_role
    FROM public.profiles
    WHERE id = current_user_id;

    -- Only admin can change roles
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Only admins can change user roles';
    END IF;

    -- Prevent changing own role (at least one admin must exist)
    IF target_user_id = current_user_id AND new_role != 'admin' THEN
        -- Check if this is the last admin
        IF (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin') <= 1 THEN
            RAISE EXCEPTION 'Cannot remove the last admin role. Promote another user to admin first.';
        END IF;
    END IF;

    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."validate_role_change"("target_user_id" "uuid", "new_role" "text", "current_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_role_change_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    current_user_role TEXT;
BEGIN
    -- Only validate if role is actually changing
    IF OLD.role = NEW.role THEN
        RETURN NEW;
    END IF;

    -- Skip validation if no authenticated user (e.g., during seed/migration)
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get current user's role (the one making the change)
    SELECT role INTO current_user_role
    FROM public.profiles
    WHERE id = auth.uid();

    -- Only admin can change roles
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Only admins can change user roles';
    END IF;

    -- Prevent admin from removing their own admin role if they are the last admin
    IF NEW.id = auth.uid() AND NEW.role != 'admin' THEN
        IF (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin') <= 1 THEN
            RAISE EXCEPTION 'Cannot remove your own admin role as the last admin. Promote another user to admin first.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_role_change_trigger"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


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
    "session_price_usd" numeric(10,2),
    "password" "text",
    "role" "text" DEFAULT 'mentor'::"text",
    "reset_token" "text",
    "reset_token_expires_at" timestamp with time zone,
    CONSTRAINT "mentors_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'mentor'::"text"])))
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



ALTER TABLE ONLY "public"."app_config"
    ADD CONSTRAINT "app_config_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."mentors"
    ADD CONSTRAINT "mentors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_mentors_active" ON "public"."mentors" USING "btree" ("is_active");



CREATE INDEX "idx_mentors_created_at" ON "public"."mentors" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_mentors_display_order" ON "public"."mentors" USING "btree" ("display_order");



CREATE INDEX "idx_mentors_reset_token" ON "public"."mentors" USING "btree" ("reset_token");



CREATE OR REPLACE TRIGGER "update_mentors_updated_at" BEFORE UPDATE ON "public"."mentors" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE POLICY "Enable delete access for all users" ON "public"."mentors" FOR DELETE USING (true);



CREATE POLICY "Enable insert access for all users" ON "public"."mentors" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."mentors" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."reviews" FOR SELECT USING (true);



CREATE POLICY "Enable update access for all users" ON "public"."mentors" FOR UPDATE USING (true);



ALTER TABLE "public"."app_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mentors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_profiles_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_profiles_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_profiles_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_admin_password"("p_id" "uuid", "p_hash" "text", "p_secret" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_admin_password"("p_id" "uuid", "p_hash" "text", "p_secret" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_admin_password"("p_id" "uuid", "p_hash" "text", "p_secret" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_admin_reset_token"("p_email" "text", "p_token" "text", "p_expires" timestamp with time zone, "p_secret" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_admin_reset_token"("p_email" "text", "p_token" "text", "p_expires" timestamp with time zone, "p_secret" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_admin_reset_token"("p_email" "text", "p_token" "text", "p_expires" timestamp with time zone, "p_secret" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_role_change"("target_user_id" "uuid", "new_role" "text", "current_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_role_change"("target_user_id" "uuid", "new_role" "text", "current_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_role_change"("target_user_id" "uuid", "new_role" "text", "current_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_role_change_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_role_change_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_role_change_trigger"() TO "service_role";


















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































