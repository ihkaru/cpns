#!/bin/bash

# AksaraCAT Development Server Bootstrapper
# Menyala secara seamless dan membersihkan container saat dihentikan (Ctrl+C).

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}       STARTING AKSARACAT DEVELOPMENT STACK       ${NC}"
echo -e "${BLUE}====================================================${NC}"

# Fungsi Cleanup yang dipanggil saat SIGINT/SIGTERM
cleanup() {
    echo -e "\n${YELLOW}⚠️  Menghentikan development server...${NC}"
    docker compose down
    echo -e "${GREEN}✅ Semua kontainer berhasil dihentikan secara bersih!${NC}"
    exit 0
}

# Pasang trap untuk menangkap Ctrl+C (SIGINT) dan SIGTERM
trap cleanup SIGINT SIGTERM

# 1. Jalankan docker compose
echo -e "${YELLOW}🚀 Memulai docker containers...${NC}"
docker compose up -d --build

# 2. Tunggu PostgreSQL database siap menerima koneksi
echo -e "${YELLOW}⏳ Menunggu database PostgreSQL siap...${NC}"
for i in {1..30}; do
    if docker compose exec db pg_isready -U postgres &> /dev/null; then
        echo -e "${GREEN}✅ Database siap!${NC}"
        break
    fi
    echo -n "."
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "${RED}\n❌ Database gagal menyala dalam 30 detik. Keluar...${NC}"
        cleanup
    fi
done

# 3. Jalankan migrasi dan seeding di container backend
echo -e "${YELLOW}⚙️  Menjalankan database migrations & seeder...${NC}"
docker compose exec backend php artisan migrate:fresh --seed --force

echo -e "\n${GREEN}🎉 AksaraCAT Development Stack Siap Digunakan!${NC}"
echo -e "----------------------------------------------------"
echo -e "🖥️  Frontend URL : ${GREEN}http://localhost:5173${NC}"
echo -e "🔌 Backend API  : ${GREEN}http://localhost:8000${NC}"
echo -e "----------------------------------------------------"
echo -e "${YELLOW}Tekan Ctrl+C untuk mematikan semua service secara bersih.${NC}"

# Blokir terminal tetap aktif dan log output frontend
docker compose logs -f frontend
