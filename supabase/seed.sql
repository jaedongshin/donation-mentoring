--
-- Local development seed data
-- Only test accounts are included. Real mentor data is NOT seeded.
--

SELECT pg_catalog.set_config('search_path', '', false);


--
-- Data for Name: app_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."app_config" ("key", "value") VALUES
	('API_SECRET', 'd4b8e9f0-1c2a-4b3d-8e5f-9a0c1b2d3e4f');


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES
	('mentor-pictures', 'mentor-pictures', NULL, '2025-09-28 21:34:55.704392+00', '2025-09-28 21:34:55.704392+00', true, false, 5242880, '{image/jpeg,image/png,image/gif,image/webp}', NULL, 'STANDARD'),
	('profile-photos', 'profile-photos', NULL, '2025-09-29 05:36:48.372408+00', '2025-09-29 05:36:48.372408+00', true, false, NULL, NULL, NULL, 'STANDARD');


--
-- Sequence resets
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 1, false);
SELECT pg_catalog.setval('"public"."reviews_id_seq"', 1, false);


--
-- Test accounts for local development (password: password123)
--
-- | Email                     | Role   | is_active |
-- |---------------------------|--------|-----------|
-- | test.mentor@example.com   | mentor | true      |
-- | test.pending@example.com  | mentor | false     |
-- | test.admin@example.com    | admin  | true      |
--

INSERT INTO "public"."mentors" ("id", "name_en", "location_en", "description_en", "name_ko", "location_ko", "description_ko", "picture_url", "tags", "display_order", "is_active", "created_at", "updated_at", "position_en", "position_ko", "linkedin_url", "calendly_url", "company_en", "company_ko", "email", "languages", "session_time_minutes", "session_price_usd", "password", "role", "reset_token", "reset_token_expires_at") VALUES
	('00000000-0000-0000-0000-000000000001', 'Test Mentor', 'USA', 'Test mentor account for local development.', '테스트 멘토', '미국', '로컬 개발용 테스트 멘토 계정입니다.', '', '[]', 0, true, now(), now(), 'Software Engineer', 'Software Engineer', '', '', 'Acme Corp', 'Acme Corp', 'test.mentor@example.com', '{Korean}', 60, 15.00, NULL, 'mentor', NULL, NULL),
	('00000000-0000-0000-0000-000000000002', 'Test Pending', 'USA', 'Test pending mentor account for local development.', '테스트 대기', '미국', '로컬 개발용 승인 대기 테스트 계정입니다.', '', '[]', 0, false, now(), now(), 'Software Engineer', 'Software Engineer', '', '', 'Acme Corp', 'Acme Corp', 'test.pending@example.com', '{Korean}', 60, 15.00, NULL, 'mentor', NULL, NULL),
	('00000000-0000-0000-0000-000000000003', 'Test Admin', 'USA', 'Test admin account for local development.', '테스트 관리자', '미국', '로컬 개발용 테스트 관리자 계정입니다.', '', '[]', 0, true, now(), now(), 'Admin', 'Admin', '', '', 'Acme Corp', 'Acme Corp', 'test.admin@example.com', '{Korean}', NULL, NULL, NULL, 'admin', NULL, NULL);

UPDATE "public"."mentors"
SET "password" = extensions.crypt('password123', extensions.gen_salt('bf'))
WHERE "email" IN ('test.mentor@example.com', 'test.pending@example.com', 'test.admin@example.com');

RESET ALL;
