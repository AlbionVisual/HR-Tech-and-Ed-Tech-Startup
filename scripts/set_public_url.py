#!/usr/bin/env python3
import re
import sys
from pathlib import Path
from urllib.parse import urlsplit

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"


def isLocalHost(host):
    if host in {"localhost", "127.0.0.1"}:
        return True
    if host.endswith(".local"):
        return True
    return bool(re.match(r"^(10\.\d|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)", host))


def patchEnv(text, values):
    lines = text.splitlines()
    seen = set()
    result = []
    for line in lines:
        key = line.split("=", 1)[0].strip()
        if "=" in line and key in values:
            result.append(key + "=" + values[key])
            seen.add(key)
        else:
            result.append(line)
    for key, value in values.items():
        if key not in seen:
            result.append(key + "=" + value)
    return "\n".join(result).strip() + "\n"


if len(sys.argv) != 2:
    raise SystemExit("usage: scripts/set_public_url.py https://host")

raw = sys.argv[1].strip().rstrip("/")
parts = urlsplit(raw)
if parts.scheme != "https" or not parts.hostname:
    raise SystemExit("URL must be https://host")
if ":" in parts.hostname:
    raise SystemExit("IPv6 is not supported by this script")
if parts.path or parts.query or parts.fragment:
    raise SystemExit("Pass only the origin, e.g. https://app.example.com")
if parts.port not in (None, 443):
    raise SystemExit("Only port 443 is published by docker compose")

host = parts.hostname.lower()
local = isLocalHost(host)
redirect = raw + "/api/v1/auth/telegram/callback"
values = {
    "APP_DOMAIN": host,
    "APP_PUBLIC_URL": raw,
    "TELEGRAM_REDIRECT_URI": redirect,
    "CADDY_TLS_LINE": "tls internal" if local else "",
    "COOKIE_SECURE": "true",
}

text = ENV_PATH.read_text() if ENV_PATH.exists() else ""
ENV_PATH.write_text(patchEnv(text, values))

print("updated", ENV_PATH)
for key, value in values.items():
    print(" ", key + "=" + value)
print()
print("BotFather -> Login Widget -> Allowed URLs:")
print(" ", redirect)
print(" ", raw)
print()
print("restart:")
print("  docker compose up -d")
print("check:")
print("  curl" + (" -k" if local else "") + " " + raw + "/health")
