#!/usr/bin/env bash
set -euo pipefail

echo "Checking for admin imports from the SSR helper..."
grep -RInE \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=.git \
  --exclude="check-supabase-imports.sh" \
  "supabaseAdmin.*@/supabase/server|from ['\"]@/supabase/server['\"].*supabaseAdmin|import \{[^}]*supabaseAdmin[^}]*\} from ['\"]@/supabase/server['\"]" \
  . || true

echo
echo "Checking for raw secret-key usage outside the admin helper..."
grep -RInE \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=.git \
  --exclude=".env.local" \
  --exclude="check-supabase-imports.sh" \
  "SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY|service_role" \
  . | grep -v "supabase/admin.ts" | grep -v "lib/env.ts" || true

echo
echo "Checking for imports of server/admin helpers..."
grep -RInE \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=.git \
  --exclude="check-supabase-imports.sh" \
  "from ['\"]@/supabase/server['\"]|from ['\"]@/supabase/admin['\"]" \
  . || true

echo
echo "Done."