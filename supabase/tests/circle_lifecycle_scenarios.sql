-- Scenario test for circle lifecycle, cancellation, and seat moves.
--
-- Run in the Supabase SQL editor (or psql) AFTER the
-- circle_lifecycle_entries_and_cancellation migration. It creates test members
-- and drawings, exercises every path, and then RAISES at the end so the whole
-- transaction rolls back: nothing it creates is kept. The error message is
-- the report; each line says what was expected.
--
-- Assumes an empty database (no real members yet), since it fills Silver
-- circle 1 to 400.
do $test$
declare
  r text[] := '{}';
  v json;
  v_admin uuid;
  v_fake uuid := gen_random_uuid();
  a bigint; b bigint; c bigint; f bigint; e bigint; x bigint; y bigint; g1 bigint; g2 bigint; g3 bigint; h bigint; k bigint;
  c1 integer; c2 integer; gc1 integer; gc2 integer;
  d_first bigint; d_month bigint; d_gfirst bigint;
  i integer;
begin
  execute $f$create function pg_temp.co(p_email text, p_tier text) returns bigint language sql as $b$
    select (public.process_checkout('Test Person', null, false, p_email, '5551234567', '1 Main St', 'Albany', 'NY', '12207', p_tier, 'General', null, null, '1990-01-01'::date)->>'subscription_id')::bigint
  $b$$f$;
  execute $f$create function pg_temp.cnt(p_circle integer) returns integer language sql as $b$ select current_members from public.circles where id = p_circle $b$$f$;
  execute $f$create function pg_temp.cn(p_sub bigint) returns integer language sql as $b$ select c.circle_number from public."Subscriptions" s join public.circles c on c.id = s.circle_id where s.id = p_sub $b$$f$;
  execute $f$create function pg_temp.st(p_sub bigint) returns text language sql as $b$ select status from public."Subscriptions" where id = p_sub $b$$f$;

  select user_id into v_admin from public.admins limit 1;
  select id into c1 from public.circles where tier = 'silver' and circle_number = 1;
  select id into gc1 from public.circles where tier = 'gold' and circle_number = 1;

  -- 1. three joins in a filling circle, each with a first-drawing entry
  a := pg_temp.co('a@t.invalid', 'silver'); b := pg_temp.co('b@t.invalid', 'silver'); c := pg_temp.co('c@t.invalid', 'silver');
  r := r || format('1 entries in c1 first drawing=%s (expect 3), count=%s', (select count(*) from public.drawing_entries e join public.drawings d on d.id = e.drawing_id where d.circle_id = c1 and d.kind = 'first'), pg_temp.cnt(c1));

  -- 2. cancel in a filling circle: immediate, seat opens, entry kept
  v := public.cancel_subscription(a);
  r := r || format('2 cancel A (filling)=%s count=%s (expect cancelled, still_entered, 2)', v, pg_temp.cnt(c1));

  -- 3. fill to 400
  for i in 1..398 loop perform pg_temp.co('fill' || i || '@t.invalid', 'silver'); end loop;
  r := r || format('3 count=%s filled=%s first_date=%s expected=%s', pg_temp.cnt(c1), (select filled_at is not null from public.circles where id = c1),
    (select drawing_date from public.drawings where circle_id = c1 and kind = 'first'), public.drawing_date_on_or_after(public.amplify_today() + 14));

  -- 4. overflow goes to circle 2
  x := pg_temp.co('x@t.invalid', 'silver');
  select circle_id into c2 from public."Subscriptions" where id = x;
  r := r || format('4 X circle_number=%s (expect 2)', pg_temp.cn(x));

  -- 5. cancel in filled-but-filling circle 1: immediate, X moves up, X keeps its circle-2 entry
  v := public.cancel_subscription(b);
  r := r || format('5 cancel B=%s; X circle=%s c1=%s c2=%s X entry in c2 first=%s (expect cancelled, 1, 400, 0, true)', v, pg_temp.cn(x), pg_temp.cnt(c1), pg_temp.cnt(c2),
    exists (select 1 from public.drawing_entries e join public.drawings d on d.id = e.drawing_id where e.subscription_id = x and d.circle_id = c2 and d.kind = 'first'));

  -- 6. first drawing: can't be held early; then held -> active + next monthly drawing
  select id into d_first from public.drawings where circle_id = c1 and kind = 'first';
  begin
    perform public.mark_drawing_held(d_first);
    r := r || '6a FAIL: future drawing was marked held'::text;
  exception when others then
    r := r || ('6a guard ok: ' || sqlerrm);
  end;
  update public.drawings set drawing_date = public.amplify_today() where id = d_first;
  v := public.mark_drawing_held(d_first);
  select id into d_month from public.drawings where circle_id = c1 and kind = 'monthly' and status = 'scheduled';
  r := r || format('6 held first=%s; c1 status=%s; monthly date=%s', v, (select status from public.circles where id = c1), (select drawing_date from public.drawings where id = d_month));

  -- 7. paid cancel in an active circle: 'cancelling', seat held; a retried webhook doesn't double-enter
  perform public.record_contribution(c, 'inv_c'); perform public.record_contribution(c, 'inv_c');
  v := public.cancel_subscription(c);
  r := r || format('7 C entries in monthly=%s; cancel C=%s; c1=%s (expect 1, cancelling, 400)', (select count(*) from public.drawing_entries where subscription_id = c and drawing_id = d_month), v, pg_temp.cnt(c1));

  -- 8. a cancelling member can't join the same tier again
  select id into f from public."Subscriptions" where email = 'fill1@t.invalid';
  perform public.record_contribution(f, 'inv_f');
  v := public.cancel_subscription(f);
  begin
    perform pg_temp.co('fill1@t.invalid', 'silver');
    r := r || '8 FAIL: rejoin allowed'::text;
  exception when others then
    r := r || ('8 cancel F=' || v::text || '; rejoin blocked: ' || sqlerrm);
  end;

  -- 9. resume and re-cancel through the member RPCs
  update public."Subscriptions" set user_id = v_admin where id = f;
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  v := public.resume_my_subscription(f);
  r := r || format('9 resume F=%s status=%s', v, pg_temp.st(f));
  v := public.cancel_my_subscription(f);
  r := r || format('9b cancel F again=%s', v);
  perform set_config('request.jwt.claims', '', true);

  -- 10. circle 1 is full (cancelling members still seated): new member goes to circle 2
  y := pg_temp.co('y@t.invalid', 'silver');
  r := r || format('10 Y circle=%s (expect 2)', pg_temp.cn(y));

  -- 11. monthly drawing held: C and F end, their seats open, Y moves up
  update public.drawings set drawing_date = public.amplify_today() - 1 where id = d_month;
  v := public.mark_drawing_held(d_month);
  r := r || format('11 held monthly=%s; C=%s F=%s; Y circle=%s; c1=%s c2=%s (expect 2 completed, cancelled, cancelled, 1, 399, 0)', v, pg_temp.st(c), pg_temp.st(f), pg_temp.cn(y), pg_temp.cnt(c1), pg_temp.cnt(c2));

  -- 12. unpaid cancel in an active circle: immediate
  select id into e from public."Subscriptions" where email = 'fill2@t.invalid';
  v := public.cancel_subscription(e);
  r := r || format('12 cancel E (unpaid, active)=%s; c1=%s (expect cancelled, no entry, 398)', v, pg_temp.cnt(c1));

  -- 13. backstop + retire + reassignment
  g1 := pg_temp.co('g1@t.invalid', 'gold'); g2 := pg_temp.co('g2@t.invalid', 'gold');
  begin
    perform public.set_circle_backstop(gc1, public.drawing_date_on_or_after(public.amplify_today()) + 1);
    r := r || '13a FAIL: non-drawing date accepted'::text;
  exception when others then
    r := r || ('13a backstop validation: ' || sqlerrm);
  end;
  perform public.set_circle_backstop(gc1, public.drawing_date_on_or_after(public.amplify_today()));
  select id into d_gfirst from public.drawings where circle_id = gc1 and kind = 'first';
  r := r || format('13b gold first drawing date=%s', (select drawing_date from public.drawings where id = d_gfirst));
  update public.drawings set drawing_date = public.amplify_today() where id = d_gfirst;
  v := public.mark_drawing_held(d_gfirst);
  r := r || format('13c held gold first (never filled)=%s; status=%s (expect retired, 2 waiting)', v, (select status from public.circles where id = gc1));
  g3 := pg_temp.co('g3@t.invalid', 'gold');
  select circle_id into gc2 from public."Subscriptions" where id = g3;
  r := r || format('13d G3 circle=%s (expect 2)', pg_temp.cn(g3));
  v := public.cancel_subscription(g3);
  r := r || format('13e cancel G3=%s; G1 circle=%s; gc1=%s gc2=%s (expect G1 moved to 2, 1, 1)', v, pg_temp.cn(g1), pg_temp.cnt(gc1), pg_temp.cnt(gc2));

  -- 14. tier change
  select id into h from public."Subscriptions" where email = 'fill3@t.invalid';
  v := public.process_tier_change(h::integer, 'diamond');
  r := r || format('14 tier change=%s; c1=%s (expect success, 397)', v, pg_temp.cnt(c1));

  -- 15. deleting the login cancels the membership (paid entry -> cancelling)
  insert into auth.users (id, aud, role, email) values (v_fake, 'authenticated', 'authenticated', 'del@t.invalid');
  k := pg_temp.co('del@t.invalid', 'silver');
  update public."Subscriptions" set user_id = v_fake where id = k;
  delete from auth.users where id = v_fake;
  r := r || format('15 deleted login: K status=%s user_id=%s (expect cancelling, null)', pg_temp.st(k), (select user_id from public."Subscriptions" where id = k));

  -- 16. counters agree with reality, and grants
  r := r || format('16 drift rows=%s (expect 0)', (select count(*) from public.circle_reconciliation));
  r := r || format('17 grants anon:cancel=%s auth:cancel=%s auth:resume=%s anon:resume=%s auth:record=%s auth:mark=%s anon:drawings=%s auth:roster_insert=%s (expect f f t f f f f f)',
    has_function_privilege('anon', 'public.cancel_subscription(bigint)', 'execute'),
    has_function_privilege('authenticated', 'public.cancel_subscription(bigint)', 'execute'),
    has_function_privilege('authenticated', 'public.resume_my_subscription(bigint)', 'execute'),
    has_function_privilege('anon', 'public.resume_my_subscription(bigint)', 'execute'),
    has_function_privilege('authenticated', 'public.record_contribution(bigint,text)', 'execute'),
    has_function_privilege('authenticated', 'public.mark_drawing_held(bigint)', 'execute'),
    has_table_privilege('anon', 'public.drawings', 'select'),
    has_table_privilege('authenticated', 'public.sweepstakes_roster', 'insert'));

  raise exception 'SCENARIO REPORT (rolled back)%', E'\n' || array_to_string(r, E'\n');
end
$test$;
