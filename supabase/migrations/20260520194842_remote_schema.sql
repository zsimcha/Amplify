


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


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."cancel_and_rebalance"("p_subscription_id" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_target_circle_id INTEGER; v_replacement_sub_id INTEGER;
    v_source_circle_id INTEGER; v_tier TEXT; v_status TEXT;
BEGIN
    -- Added v_status to the SELECT statement
    SELECT circle_id, tier, status INTO v_target_circle_id, v_tier, v_status
    FROM public."Subscriptions" WHERE id = p_subscription_id;

    -- THE GUARD: If it doesn't exist, or is already cancelled, exit immediately!
    IF v_target_circle_id IS NULL OR v_status = 'cancelled' THEN
        RETURN;
    END IF;

    UPDATE public."Subscriptions" SET status = 'cancelled' WHERE id = p_subscription_id;
    UPDATE public.circles SET current_members = current_members - 1, status = 'filling' WHERE id = v_target_circle_id;
    
    SELECT s.id, s.circle_id INTO v_replacement_sub_id, v_source_circle_id
    FROM public."Subscriptions" s JOIN public.circles c ON s.circle_id = c.id
    WHERE s.status = 'active' AND c.status = 'filling' AND c.tier = v_tier AND c.circle_number > (SELECT circle_number FROM public.circles WHERE id = v_target_circle_id)
    ORDER BY s.created_at ASC LIMIT 1;

    IF v_replacement_sub_id IS NOT NULL THEN
        UPDATE public."Subscriptions" SET circle_id = v_target_circle_id WHERE id = v_replacement_sub_id;
        UPDATE public.circles SET current_members = current_members + 1, status = CASE WHEN current_members + 1 >= 400 THEN 'full' ELSE 'filling' END WHERE id = v_target_circle_id;
        UPDATE public.circles SET current_members = current_members - 1 WHERE id = v_source_circle_id;
    END IF;
END;
$$;


ALTER FUNCTION "public"."cancel_and_rebalance"("p_subscription_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cancel_and_rebalance"("p_subscription_id" integer, "p_new_status" "text" DEFAULT 'cancelled'::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_target_circle_id INTEGER; v_replacement_sub_id INTEGER;
    v_source_circle_id INTEGER; v_tier TEXT; v_status TEXT;
BEGIN
    SELECT circle_id, tier, status INTO v_target_circle_id, v_tier, v_status
    FROM public."Subscriptions" WHERE id = p_subscription_id;

    -- Idempotency Guard: Exit if they are already in the target state or already cancelled
    IF v_target_circle_id IS NULL OR v_status = p_new_status OR v_status = 'cancelled' THEN
        RETURN;
    END IF;

    -- Update their status (e.g., to 'past_due' or 'cancelled')
    UPDATE public."Subscriptions" SET status = p_new_status WHERE id = p_subscription_id;
    
    -- Vacate their seat immediately
    UPDATE public.circles SET current_members = current_members - 1, status = 'filling' WHERE id = v_target_circle_id;
    
    -- Waterfall Backfill (The Bump-Up)
    SELECT s.id, s.circle_id INTO v_replacement_sub_id, v_source_circle_id
    FROM public."Subscriptions" s JOIN public.circles c ON s.circle_id = c.id
    WHERE s.status = 'active' AND c.status = 'filling' AND c.tier = v_tier AND c.circle_number > (SELECT circle_number FROM public.circles WHERE id = v_target_circle_id)
    ORDER BY s.created_at ASC LIMIT 1;

    IF v_replacement_sub_id IS NOT NULL THEN
        -- Route the replacement user to the older circle
        UPDATE public."Subscriptions" SET circle_id = v_target_circle_id WHERE id = v_replacement_sub_id;
        
        -- Increment the older circle (Fixed math logic for absolute clarity)
        UPDATE public.circles 
        SET current_members = current_members + 1, 
            status = CASE WHEN current_members >= 399 THEN 'full' ELSE 'filling' END 
        WHERE id = v_target_circle_id;
        
        -- Decrement the newer circle
        UPDATE public.circles SET current_members = current_members - 1 WHERE id = v_source_circle_id;
    END IF;
END;
$$;


ALTER FUNCTION "public"."cancel_and_rebalance"("p_subscription_id" integer, "p_new_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_checkout"("p_full_name" "text", "p_display_name" "text", "p_is_anonymous" boolean, "p_email" "text", "p_phone" "text", "p_address" "text", "p_city" "text", "p_state" "text", "p_zip_code" "text", "p_tier" "text", "p_community_name" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_community_id public.communities.id%TYPE;
    v_circle_id public.circles.id%TYPE;
    v_circle_number INTEGER;
    v_subscription_id public."Subscriptions".id%TYPE;
    v_tier_price NUMERIC; 
BEGIN
    -- 1. SERVER-SIDE PRICING
    IF p_tier = 'silver' THEN v_tier_price := 250;
    ELSIF p_tier = 'gold' THEN v_tier_price := 500;
    ELSIF p_tier = 'diamond' THEN v_tier_price := 1000;
    ELSE RAISE EXCEPTION 'Invalid tier selected.'; END IF;

    -- 2. COMMUNITY ROUTING
    SELECT id INTO v_community_id FROM public.communities WHERE name = p_community_name LIMIT 1;
    IF v_community_id IS NULL THEN
        INSERT INTO public.communities (name, members, monthly, silver, gold, diamond)
        VALUES (p_community_name, 0, 0, 0, 0, 0) RETURNING id INTO v_community_id;
    END IF;

    -- 3. CIRCLE ROUTING
    SELECT id, circle_number INTO v_circle_id, v_circle_number
    FROM public.circles
    WHERE current_members < 400 AND tier = p_tier
    ORDER BY circle_number ASC LIMIT 1 FOR UPDATE;

    IF v_circle_id IS NULL THEN
        SELECT COALESCE(MAX(circle_number), 0) + 1 INTO v_circle_number FROM public.circles WHERE tier = p_tier;
        INSERT INTO public.circles (tier, circle_number, current_members, status)
        VALUES (p_tier, v_circle_number, 0, 'filling')
        RETURNING id INTO v_circle_id;
    END IF;

    -- 4. INSERT SUBSCRIPTION
    INSERT INTO public."Subscriptions" (
        "full name", display_name, is_anonymous, email, phone, address, city, state, zip_code, tier, community_id, circle_id, status
    ) VALUES (
        p_full_name, p_display_name, p_is_anonymous, p_email, p_phone, p_address, p_city, p_state, p_zip_code, p_tier, v_community_id, v_circle_id, 'active' 
    ) RETURNING id INTO v_subscription_id;

    -- 5. UPDATE METRICS (*** STANDARDIZED MATH PATTERN ***)
    UPDATE public.circles 
    SET current_members = current_members + 1, 
        status = CASE WHEN current_members >= 399 THEN 'full' ELSE 'filling' END 
    WHERE id = v_circle_id;
    
    UPDATE public.communities SET 
        members = members + 1, 
        monthly = monthly + v_tier_price,
        silver = silver + CASE WHEN p_tier = 'silver' THEN 1 ELSE 0 END, 
        gold = gold + CASE WHEN p_tier = 'gold' THEN 1 ELSE 0 END, 
        diamond = diamond + CASE WHEN p_tier = 'diamond' THEN 1 ELSE 0 END 
    WHERE id = v_community_id;

    -- 6. RETURN FRONTEND DATA
    RETURN json_build_object('success', true, 'subscription_id', v_subscription_id, 'assigned_circle', v_circle_number);
END;
$$;


ALTER FUNCTION "public"."process_checkout"("p_full_name" "text", "p_display_name" "text", "p_is_anonymous" boolean, "p_email" "text", "p_phone" "text", "p_address" "text", "p_city" "text", "p_state" "text", "p_zip_code" "text", "p_tier" "text", "p_community_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_tier_change"("p_subscription_id" integer, "p_new_tier" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_old_tier TEXT; v_old_circle_id INTEGER; v_community_id INTEGER;
    v_new_circle_id INTEGER; v_new_circle_number INTEGER;
    v_replacement_sub_id INTEGER; v_source_circle_id INTEGER;
    v_new_tier_price NUMERIC;
BEGIN
    -- Server-side pricing validation
    IF p_new_tier = 'silver' THEN v_new_tier_price := 250;
    ELSIF p_new_tier = 'gold' THEN v_new_tier_price := 500;
    ELSIF p_new_tier = 'diamond' THEN v_new_tier_price := 1000;
    ELSE RAISE EXCEPTION 'Invalid tier selected.'; END IF;

    SELECT tier, circle_id, community_id INTO v_old_tier, v_old_circle_id, v_community_id
    FROM public."Subscriptions" WHERE id = p_subscription_id AND status = 'active';

    IF v_old_tier IS NULL OR v_old_tier = p_new_tier THEN
        RETURN json_build_object('success', false, 'message', 'Invalid tier change');
    END IF;

    -- Phase 1: Bump Up (Old Circle)
    UPDATE public.circles SET current_members = current_members - 1, status = 'filling' WHERE id = v_old_circle_id;
    
    SELECT s.id, s.circle_id INTO v_replacement_sub_id, v_source_circle_id
    FROM public."Subscriptions" s JOIN public.circles c ON s.circle_id = c.id
    WHERE s.status = 'active' AND c.status = 'filling' AND c.tier = v_old_tier AND c.circle_number > (SELECT circle_number FROM public.circles WHERE id = v_old_circle_id)
    ORDER BY s.created_at ASC LIMIT 1;

    IF v_replacement_sub_id IS NOT NULL THEN
        UPDATE public."Subscriptions" SET circle_id = v_old_circle_id WHERE id = v_replacement_sub_id;
        
        -- *** STANDARDIZED MATH PATTERN ***
        UPDATE public.circles 
        SET current_members = current_members + 1, 
            status = CASE WHEN current_members >= 399 THEN 'full' ELSE 'filling' END 
        WHERE id = v_old_circle_id;
        
        UPDATE public.circles SET current_members = current_members - 1 WHERE id = v_source_circle_id;
    END IF;

    -- Phase 2: Route to New Circle
    SELECT id, circle_number INTO v_new_circle_id, v_new_circle_number
    FROM public.circles WHERE current_members < 400 AND tier = p_new_tier ORDER BY circle_number ASC LIMIT 1 FOR UPDATE;

    IF v_new_circle_id IS NULL THEN
        SELECT COALESCE(MAX(circle_number), 0) + 1 INTO v_new_circle_number FROM public.circles WHERE tier = p_new_tier;
        INSERT INTO public.circles (tier, circle_number, current_members, status) VALUES (p_new_tier, v_new_circle_number, 0, 'filling') RETURNING id INTO v_new_circle_id;
    END IF;

    UPDATE public."Subscriptions" SET tier = p_new_tier, circle_id = v_new_circle_id WHERE id = p_subscription_id;
    
    -- *** STANDARDIZED MATH PATTERN ***
    UPDATE public.circles 
    SET current_members = current_members + 1, 
        status = CASE WHEN current_members >= 399 THEN 'full' ELSE 'filling' END 
    WHERE id = v_new_circle_id;

    -- Phase 3: Update vanity metrics (NET DIFFERENCE MATH + VANITY-ONLY ADDITIONS)
    UPDATE public.communities SET 
        monthly = monthly + v_new_tier_price - (
            CASE WHEN v_old_tier = 'silver' THEN 250 
                 WHEN v_old_tier = 'gold' THEN 500 
                 WHEN v_old_tier = 'diamond' THEN 1000 ELSE 0 END
        ),
        silver = silver + CASE WHEN p_new_tier = 'silver' THEN 1 ELSE 0 END,
        gold   = gold   + CASE WHEN p_new_tier = 'gold'   THEN 1 ELSE 0 END,
        diamond = diamond + CASE WHEN p_new_tier = 'diamond' THEN 1 ELSE 0 END
    WHERE id = v_community_id;

    RETURN json_build_object('success', true, 'new_tier', p_new_tier, 'assigned_circle', v_new_circle_number);
END;
$$;


ALTER FUNCTION "public"."process_tier_change"("p_subscription_id" integer, "p_new_tier" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reactivate_subscription"("p_subscription_id" integer) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_tier TEXT; v_status TEXT; v_new_circle_id INTEGER; v_new_circle_number INTEGER;
BEGIN
    SELECT tier, status INTO v_tier, v_status
    FROM public."Subscriptions" WHERE id = p_subscription_id;

    -- Guard: Only past_due users can be reactivated
    IF v_status != 'past_due' THEN
        RETURN json_build_object('success', false, 'message', 'Subscription is not past_due');
    END IF;

    -- Find oldest open circle for their tier
    SELECT id, circle_number INTO v_new_circle_id, v_new_circle_number
    FROM public.circles
    WHERE current_members < 400 AND tier = v_tier
    ORDER BY circle_number ASC LIMIT 1 FOR UPDATE;

    -- If no open circle exists, create one
    IF v_new_circle_id IS NULL THEN
        SELECT COALESCE(MAX(circle_number), 0) + 1 INTO v_new_circle_number FROM public.circles WHERE tier = v_tier;
        INSERT INTO public.circles (tier, circle_number, current_members, status)
        VALUES (v_tier, v_new_circle_number, 0, 'filling')
        RETURNING id INTO v_new_circle_id;
    END IF;

    -- Put them at the back of the queue and mark active
    UPDATE public."Subscriptions"
    SET status = 'active', circle_id = v_new_circle_id
    WHERE id = p_subscription_id;

    -- Increment new circle count (Fixed math logic for absolute clarity)
    UPDATE public.circles 
    SET current_members = current_members + 1, 
        status = CASE WHEN current_members >= 399 THEN 'full' ELSE 'filling' END 
    WHERE id = v_new_circle_id;

    RETURN json_build_object('success', true, 'new_circle', v_new_circle_number);
END;
$$;


ALTER FUNCTION "public"."reactivate_subscription"("p_subscription_id" integer) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."Subscriptions" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "full name" "text",
    "email" "text" NOT NULL,
    "phone" "text",
    "tier" "text" NOT NULL,
    "stripe_sup_id" "text",
    "status" "text" NOT NULL,
    "community_id" bigint NOT NULL,
    "address" "text",
    "city" "text",
    "state" "text",
    "zip_code" "text",
    "circle_id" integer NOT NULL,
    "display_name" "text",
    "is_anonymous" boolean DEFAULT false
);


ALTER TABLE "public"."Subscriptions" OWNER TO "postgres";


ALTER TABLE "public"."Subscriptions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Subscriptions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE OR REPLACE VIEW "public"."backend_accurate_stats" WITH ("security_invoker"='on') AS
 SELECT "count"("id") AS "total_active_donors",
    "count"("id") FILTER (WHERE ("tier" = 'silver'::"text")) AS "total_silver",
    "count"("id") FILTER (WHERE ("tier" = 'gold'::"text")) AS "total_gold",
    "count"("id") FILTER (WHERE ("tier" = 'diamond'::"text")) AS "total_diamond",
    "sum"(
        CASE
            WHEN ("tier" = 'silver'::"text") THEN 250
            WHEN ("tier" = 'gold'::"text") THEN 500
            WHEN ("tier" = 'diamond'::"text") THEN 1000
            ELSE 0
        END) AS "true_active_monthly_revenue"
   FROM "public"."Subscriptions"
  WHERE ("status" = 'active'::"text");


ALTER VIEW "public"."backend_accurate_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."circles" (
    "id" integer NOT NULL,
    "tier" "text" NOT NULL,
    "circle_number" integer NOT NULL,
    "current_members" integer DEFAULT 0,
    "status" "text" DEFAULT 'filling'::"text"
);


ALTER TABLE "public"."circles" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."circles_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."circles_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."circles_id_seq" OWNED BY "public"."circles"."id";



CREATE TABLE IF NOT EXISTS "public"."communities" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" DEFAULT 'General Circle'::"text",
    "members" integer DEFAULT 0,
    "monthly" integer DEFAULT 0,
    "silver" integer DEFAULT 0,
    "gold" integer DEFAULT 0,
    "diamond" integer DEFAULT 0
);


ALTER TABLE "public"."communities" OWNER TO "postgres";


ALTER TABLE "public"."communities" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."communities_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE OR REPLACE VIEW "public"."sweepstakes_roster" WITH ("security_invoker"='on') AS
 SELECT "c"."tier" AS "circle_tier",
    "c"."circle_number",
    "s"."full name",
    "s"."email",
    "s"."phone",
    "s"."tier" AS "user_tier",
    "s"."created_at" AS "join_date"
   FROM ("public"."circles" "c"
     JOIN "public"."Subscriptions" "s" ON (("s"."circle_id" = "c"."id")))
  WHERE ("s"."status" = 'active'::"text")
  ORDER BY "c"."tier", "c"."circle_number", "s"."created_at";


ALTER VIEW "public"."sweepstakes_roster" OWNER TO "postgres";


ALTER TABLE ONLY "public"."circles" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."circles_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."Subscriptions"
    ADD CONSTRAINT "Subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."circles"
    ADD CONSTRAINT "circles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."circles"
    ADD CONSTRAINT "circles_tier_circle_number_key" UNIQUE ("tier", "circle_number");



ALTER TABLE ONLY "public"."communities"
    ADD CONSTRAINT "communities_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."communities"
    ADD CONSTRAINT "communities_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_subscriptions_circle_id" ON "public"."Subscriptions" USING "btree" ("circle_id");



CREATE INDEX "idx_subscriptions_community_id" ON "public"."Subscriptions" USING "btree" ("community_id");



CREATE INDEX "idx_subscriptions_created_at" ON "public"."Subscriptions" USING "btree" ("created_at");



CREATE INDEX "idx_subscriptions_status_tier" ON "public"."Subscriptions" USING "btree" ("status", "tier");



CREATE OR REPLACE TRIGGER "Welcome Email" AFTER INSERT ON "public"."Subscriptions" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://gloncuhgefzrpuwbzoke.supabase.co/functions/v1/send-welcome-email', 'POST', '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdsb25jdWhnZWZ6cnB1d2J6b2tlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc1MTMwMywiZXhwIjoyMDg3MzI3MzAzfQ.G8k_NKk5tW3-qGrrmYmnR_PLMnh3nCpg40rtwQGk3Tk"}', '{}', '5000');



ALTER TABLE ONLY "public"."Subscriptions"
    ADD CONSTRAINT "Subscriptions_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id");



ALTER TABLE ONLY "public"."Subscriptions"
    ADD CONSTRAINT "subscriptions_circle_id_fkey" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id");



CREATE POLICY "Allow public read access to circles" ON "public"."circles" FOR SELECT USING (true);



CREATE POLICY "Allow public read-only access to communities" ON "public"."communities" FOR SELECT USING (true);



ALTER TABLE "public"."Subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."circles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."communities" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































REVOKE ALL ON FUNCTION "public"."cancel_and_rebalance"("p_subscription_id" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cancel_and_rebalance"("p_subscription_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."cancel_and_rebalance"("p_subscription_id" integer, "p_new_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."cancel_and_rebalance"("p_subscription_id" integer, "p_new_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_and_rebalance"("p_subscription_id" integer, "p_new_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_checkout"("p_full_name" "text", "p_display_name" "text", "p_is_anonymous" boolean, "p_email" "text", "p_phone" "text", "p_address" "text", "p_city" "text", "p_state" "text", "p_zip_code" "text", "p_tier" "text", "p_community_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."process_checkout"("p_full_name" "text", "p_display_name" "text", "p_is_anonymous" boolean, "p_email" "text", "p_phone" "text", "p_address" "text", "p_city" "text", "p_state" "text", "p_zip_code" "text", "p_tier" "text", "p_community_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_checkout"("p_full_name" "text", "p_display_name" "text", "p_is_anonymous" boolean, "p_email" "text", "p_phone" "text", "p_address" "text", "p_city" "text", "p_state" "text", "p_zip_code" "text", "p_tier" "text", "p_community_name" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."process_tier_change"("p_subscription_id" integer, "p_new_tier" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."process_tier_change"("p_subscription_id" integer, "p_new_tier" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."reactivate_subscription"("p_subscription_id" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reactivate_subscription"("p_subscription_id" integer) TO "service_role";


















GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."Subscriptions" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."Subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."Subscriptions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Subscriptions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Subscriptions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Subscriptions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."backend_accurate_stats" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."circles" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."circles" TO "authenticated";
GRANT ALL ON TABLE "public"."circles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."circles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."circles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."circles_id_seq" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."communities" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."communities" TO "authenticated";
GRANT ALL ON TABLE "public"."communities" TO "service_role";



GRANT ALL ON SEQUENCE "public"."communities_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."communities_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."communities_id_seq" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."sweepstakes_roster" TO "authenticated";
GRANT ALL ON TABLE "public"."sweepstakes_roster" TO "service_role";









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































