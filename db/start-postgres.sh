#!/bin/sh
set -eu

password=/run/prometeo/password
if [ ! -s "$password" ]; then
  if [ -s "$PGDATA/PG_VERSION" ]; then
    echo 'Falta el volumen de credenciales asociado al volumen de PostgreSQL' >&2
    exit 1
  fi
  umask 077
  temporary="$(mktemp /run/prometeo/password.XXXXXX)"
  trap 'rm -f "$temporary"' EXIT
  od -An -N 32 -tx1 /dev/urandom | tr -d ' \n' > "$temporary"
  test "$(wc -c < "$temporary")" -eq 64
  chgrp 1000 "$temporary"
  chmod 0440 "$temporary"
  mv "$temporary" "$password"
fi
export POSTGRES_PASSWORD_FILE="$password"
exec docker-entrypoint.sh "$@"
