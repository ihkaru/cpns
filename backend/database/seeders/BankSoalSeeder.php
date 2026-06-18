<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\BankSoal;
use App\Models\Packet;
use Illuminate\Support\Facades\File;

class BankSoalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $manifestPath = base_path('../scripts/scraped_packets_manifest.json');
        $jsonPath = base_path('../scripts/bank_soal_cpns.json');
        $capturedDir = base_path('../scripts/captured');

        if (!File::exists($manifestPath) || !File::exists($jsonPath)) {
            $this->command->error("File manifes atau database JSON tidak ditemukan.");
            return;
        }

        // 1. Ambil & Buat semua Soal Unik terlebih dahulu
        $questionsJson = File::get($jsonPath);
        $questions = json_decode($questionsJson, true);
        $this->command->info("Memasukkan " . count($questions) . " soal unik ke database...");

        foreach ($questions as $q) {
            BankSoal::updateOrCreate(
                ['id' => $q['id']],
                [
                    'kategori' => strtoupper($q['category']),
                    'soal' => $q['soal'],
                    'img_soal' => $q['img_soal'] ?? '',
                    'a' => $q['a'],
                    'b' => $q['b'],
                    'c' => $q['c'],
                    'd' => $q['d'],
                    'e' => $q['e'],
                    'img_a' => $q['img_a'] ?? '',
                    'img_b' => $q['img_b'] ?? '',
                    'img_c' => $q['img_c'] ?? '',
                    'img_d' => $q['img_d'] ?? '',
                    'img_e' => $q['img_e'] ?? '',
                    'kunci' => strtoupper($q['kunci']),
                    'jawaban_benar' => $q['jawaban_benar'] ?? '',
                    'skor_a' => $q['skor_a'] ?? 0,
                    'skor_b' => $q['skor_b'] ?? 0,
                    'skor_c' => $q['skor_c'] ?? 0,
                    'skor_d' => $q['skor_d'] ?? 0,
                    'skor_e' => $q['skor_e'] ?? 0,
                    'pembahasan' => $q['pembahasan'] ?? '',
                    'gambar_pembahasan' => $q['gambar_pembahasan'] ?? '',
                ]
            );
        }

        // 2. Baca manifes & buat daftar Paket
        $manifestJson = File::get($manifestPath);
        $manifest = json_decode($manifestJson, true);

        $packetsMap = []; // Menyimpan mapping judul_paket -> Model Packet
        
        foreach ($manifest as $category => $packets) {
            foreach ($packets as $p) {
                // Konfigurasi waktu default jika tidak ditentukan
                $waktu = null;
                if ($p['jenis'] === 'tryout') {
                    $waktu = 100; // 100 menit standar SKD
                } elseif (str_contains(strtolower($p['judul']), 'try out')) {
                    $waktu = 30; // TO kecil
                }

                $packetModel = Packet::updateOrCreate(
                    [
                        'kategori' => $category,
                        'judul' => $p['judul'],
                    ],
                    [
                        'jenis' => $p['jenis'],
                        'waktu_menit' => $waktu,
                    ]
                );
                
                // key gabungan untuk identifikasi unik
                $key = strtolower($category . '_' . $p['judul']);
                $packetsMap[$key] = $packetModel;
            }
        }
        $this->command->info("Telah mendaftarkan " . count($packetsMap) . " paket soal.");

        // 3. Rekonstruksi relasi Many-to-Many dari file-file captured
        $capturedFiles = File::files($capturedDir);
        $relationCount = 0;

        foreach ($capturedFiles as $file) {
            if ($file->getExtension() !== 'json') continue;

            $filename = $file->getFilename();
            $content = json_decode(File::get($file->getRealPath()), true);
            if (!$content) continue;

            $records = [];
            $targetPacket = null;

            // Kasus A: File hasil direct_scraper berformat: direct_scraped_{category}_{judul}.json
            if (str_starts_with($filename, 'direct_scraped_')) {
                // Ekstrak category dan judul dari nama file
                $parts = explode('_', str_replace('direct_scraped_', '', $filename));
                if (count($parts) >= 2) {
                    $category = $parts[0]; // e.g. TIU
                    // Gabungkan sisanya dan bersihkan ekstensi
                    $judul_clean = str_replace('.json', '', implode(' ', array_slice($parts, 1)));
                    
                    // Cari di packetsMap yang paling mirip
                    foreach ($packetsMap as $key => $packetModel) {
                        if (strtolower($packetModel->kategori) === strtolower($category)) {
                            // Bandingkan kemiripan judul dengan regex/replace
                            $clean_p_title = preg_replace('/[^a-z0-9]/', '', strtolower($packetModel->judul));
                            $clean_fn_title = preg_replace('/[^a-z0-9]/', '', strtolower($judul_clean));
                            if ($clean_p_title === $clean_fn_title || str_contains($clean_fn_title, $clean_p_title) || str_contains($clean_p_title, $clean_fn_title)) {
                                $targetPacket = $packetModel;
                                break;
                            }
                        }
                    }
                }
                
                if (isset($content['response_json']['records'])) {
                    $records = $content['response_json']['records'];
                }
            } 
            // Kasus B: File hasil fetch_missing atau raw apps script
            else {
                if (isset($content['records'])) {
                    $records = $content['records'];
                }
                
                // Cari judul paket dari records pertama
                if (!empty($records) && isset($records[0]['_judul_paket'])) {
                    $judul_p = $records[0]['_judul_paket'];
                    $categ_p = $records[0]['_category'] ?? 'TWK';
                    
                    $key = strtolower($categ_p . '_' . $judul_p);
                    if (isset($packetsMap[$key])) {
                        $targetPacket = $packetsMap[$key];
                    }
                }
                
                // Tambahan: jika file SKB Dosen atau SKB Psikotes
                if (str_contains($filename, 'skb_')) {
                    if (str_contains($filename, 'AKfycbyvChw')) {
                        // SKB Dosen
                        $key = strtolower('Tryout_SKB_Dosen');
                        if (isset($packetsMap[$key])) $targetPacket = $packetsMap[$key];
                    }
                }
            }

            if (!$targetPacket || empty($records)) {
                continue;
            }

            // Hubungkan setiap record soal di file ini ke model Packet
            $attachIds = [];
            foreach ($records as $rec) {
                if (!isset($rec['soal'])) continue;
                
                // Bersihkan HTML tags dari teks soal untuk pencocokan yang akurat
                $cleanSoalText = preg_replace('/<[^>]+>/', '', strval($rec['soal']));
                $cleanSoalText = str_replace(['&amp;', '&lt;', '&gt;', '&nbsp;', '&#39;', '&quot;'], ['&', '<', '>', ' ', "'", '"'], $cleanSoalText);
                $cleanSoalText = trim($cleanSoalText);
                $lookupKey = mb_substr($cleanSoalText, 0, 100, 'UTF-8');

                // Cari soal yang cocok di database berdasarkan 100 karakter pertama
                $dbSoal = BankSoal::where('soal', 'LIKE', $lookupKey . '%')->first();
                if ($dbSoal) {
                    $attachIds[] = $dbSoal->id;
                }
            }
            
            if (!empty($attachIds)) {
                $targetPacket->bankSoals()->syncWithoutDetaching($attachIds);
                $relationCount += count($attachIds);
            }
        }

        $this->command->info("Berhasil merelasikan total " . $relationCount . " soal ke masing-masing paket.");
    }
}
