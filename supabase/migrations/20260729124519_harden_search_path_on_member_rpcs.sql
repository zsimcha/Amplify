-- Match the hardened pattern used by the rest of the project's SECURITY
-- DEFINER functions: an empty search_path with fully-qualified references, so
-- nothing can be resolved through a caller-controlled schema.
alter function public.set_my_causes(text[]) set search_path to '';
alter function public.request_cause(text, text, text) set search_path to '';;
