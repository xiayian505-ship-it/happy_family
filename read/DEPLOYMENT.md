# Happy Family blog deployment

The blog uses two deliberately separate Supabase projects:

- `bkjqaetxwvcdciieevvs`: the pre-existing shared administrator identity provider.
- `kscbrnmhqugcwfohczve`: blog post storage and the isolated `blog-admin` bridge.

Public clients may only select rows where `published = true`. All writes and the
administrator's draft listing pass through `blog-admin`. The function validates
the bearer token against the shared Auth project's `/auth/v1/user` endpoint,
checks the established administrator UID allowlist, and only then uses the blog
project's runtime-provided service-role credential. That credential is never
sent to or stored in the browser bundle.

## Deploy from this directory

The operator must be authenticated with the Supabase CLI and authorized for the
existing blog project. These commands affect only `kscbrnmhqugcwfohczve`:

```sh
supabase link --project-ref kscbrnmhqugcwfohczve
supabase db push
supabase functions deploy blog-admin --no-verify-jwt
```

The production origin defaults to `https://happyfamily.stillnessbyslowly.com`.
For preview origins, set a comma-separated function secret before deployment:

```sh
supabase secrets set BLOG_ALLOWED_ORIGINS=https://happyfamily.stillnessbyslowly.com,https://preview.example.com
```

Do not add `SUPABASE_SERVICE_ROLE_KEY` to the website. Supabase supplies it to
the Edge Function runtime. Do not point the article client at the shared Auth
project or modify that project's users, books, policies, or RPC functions.
