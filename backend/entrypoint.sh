#!/bin/sh
set -e

# Wait for database connection using Laravel's config
echo "⏳ Menunggu database PostgreSQL siap..."
until php -r "
try {
    \$host = getenv('DB_HOST') ?: 'db';
    \$port = getenv('DB_PORT') ?: '5432';
    \$db   = getenv('DB_DATABASE') ?: 'cpns_cat';
    \$user = getenv('DB_USERNAME') ?: 'postgres';
    \$pass = getenv('DB_PASSWORD') ?: 'secretpassword';
    new PDO(\"pgsql:host=\$host;port=\$port;dbname=\$db\", \$user, \$pass);
    exit(0);
} catch (Exception \$e) {
    exit(1);
}
"; do
  echo "📡 Database belum siap, mencoba kembali dalam 2 detik..."
  sleep 2
done
echo "✅ Database siap!"

# Jalankan optimasi cache di production
if [ "${APP_ENV}" = "production" ]; then
    echo "⚙️  Mengoptimasi cache Laravel untuk Production..."
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
fi

# Jalankan database migrations (AMAN: tidak menghapus data lama, hanya menambah kolom/tabel baru)
echo "⚙️  Menjalankan database migrations..."
php artisan migrate --force

# Seed bank soal (AMAN: menggunakan updateOrCreate & sync tanpa menghapus progress user)
echo "⚙️  Menjalankan database seeder bank soal..."
php artisan db:seed --class=BankSoalSeeder --force

# Jalankan command bawaan
exec "$@"
