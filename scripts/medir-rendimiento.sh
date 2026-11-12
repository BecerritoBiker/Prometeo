#!/usr/bin/env bash
set -euo pipefail

origin="${1:-http://localhost:8080}"
origin="${origin%/}"
output="${2:-docs/lighthouse-publico}"
case "$origin" in
  https://*|http://localhost:*|http://127.0.0.1:*) ;;
  *) echo 'Usa la URL HTTPS desplegada o una dirección local con puerto.' >&2; exit 1 ;;
esac
mkdir -p "$output"
if [[ -n "${LIGHTHOUSE_CLI:-}" ]]; then
  lighthouse=(node "$LIGHTHOUSE_CLI")
else
  lighthouse=(npx --yes lighthouse@13.6.0)
fi
flags="${CHROME_FLAGS:---headless}"

# El servicio gratuito puede necesitar arrancar antes de medir.
curl -fsS --retry 4 --retry-all-errors --retry-delay 5 --max-time 80 "$origin/api/health" >/dev/null
for phase in base optimizada; do
  address="$origin/"
  if [[ "$phase" == "base" ]]; then address="$origin/?medicion=base"; fi
  "${lighthouse[@]}" "$address" --quiet --chrome-flags="$flags" \
    --only-categories=performance,accessibility,best-practices,seo \
    --output=json --output=html --output-path="$output/$phase"
done

node scripts/resumen-lighthouse.mjs "$output"
