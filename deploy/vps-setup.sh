#!/usr/bin/env bash
# First-time setup for a small Debian/Ubuntu VPS (1 vCPU / 1 GB RAM).
# Run as root: sudo bash deploy/vps-setup.sh
set -euo pipefail

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "Run as root: sudo bash deploy/vps-setup.sh" >&2
  exit 1
fi

SWAP_SIZE="${SWAP_SIZE:-2G}"
SSH_PORT="${SSH_PORT:-22}"
DEPLOY_PATH="${DEPLOY_PATH:-/opt/hrtech}"

echo "==> Swap ${SWAP_SIZE}"
if ! swapon --show=NAME --noheadings | grep -qx '/swapfile'; then
  if [[ ! -f /swapfile ]]; then
    fallocate -l "$SWAP_SIZE" /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
  fi
  swapon /swapfile
  grep -q '^/swapfile ' /etc/fstab \
    || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

cat > /etc/sysctl.d/99-hrtech.conf <<'EOF'
vm.swappiness=10
vm.vfs_cache_pressure=50
EOF
sysctl --system >/dev/null

echo "==> Firewall"
apt-get update
apt-get install -y --no-install-recommends ca-certificates curl git ufw

if [[ -n "${SSH_CONNECTION:-}" ]]; then
  CURRENT_SSH_PORT="${SSH_CONNECTION##* }"
  if [[ "$CURRENT_SSH_PORT" != "$SSH_PORT" ]]; then
    echo "Current SSH port is $CURRENT_SSH_PORT, but SSH_PORT=$SSH_PORT." >&2
    echo "Re-run with SSH_PORT=$CURRENT_SSH_PORT to avoid locking yourself out." >&2
    exit 1
  fi
fi

ufw allow "${SSH_PORT}/tcp"
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker
docker compose version

echo "==> Deploy directory"
install -d -m 755 "$DEPLOY_PATH"

cat <<EOF

VPS is ready.

Next steps:
  1. Point the DNS A record at this server.
  2. git clone <repo> ${DEPLOY_PATH}
  3. cd ${DEPLOY_PATH} && cp .env.example .env && edit .env
  4. docker compose pull && docker compose up -d
  5. curl -fsS https://<APP_DOMAIN>/ready

EOF
