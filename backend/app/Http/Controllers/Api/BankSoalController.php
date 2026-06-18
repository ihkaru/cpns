<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\BankSoal;
use App\Models\Packet;
use Illuminate\Http\JsonResponse;

class BankSoalController extends Controller
{
    /**
     * Shared key for payload encryption. Must match frontend decryption key.
     */
    private const ENCRYPTION_KEY = 'AksaraCATSecureKey2026!#$';

    /**
     * Encrypt string payload using AES-256-CBC.
     */
    private static function encryptPayload(string $data): string
    {
        $key = hash('sha256', self::ENCRYPTION_KEY, true);
        $iv = openssl_random_pseudo_bytes(16);
        $ciphertext = openssl_encrypt($data, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv);
        return base64_encode($iv . $ciphertext);
    }

    /**
     * Get all questions, optionally filtered by category.
     */
    public function index(Request $request): JsonResponse
    {
        $query = BankSoal::query();

        if ($request->has('kategori')) {
            $kategori = strtoupper($request->query('kategori'));
            $query->where('kategori', $kategori);
        }

        $soals = $query->orderBy('id')->get();

        return response()->json([
            'payload' => self::encryptPayload(json_encode($soals))
        ]);
    }

    /**
     * Get all available packets with questions count.
     */
    public function packets(Request $request): JsonResponse
    {
        $query = Packet::withCount('bankSoals');

        if ($request->has('kategori')) {
            $kategori = $request->query('kategori');
            $query->where('kategori', $kategori);
        }

        $packets = $query->get();

        return response()->json($packets);
    }

    /**
     * Get all questions in a specific packet.
     */
    public function packetQuestions($id): JsonResponse
    {
        $packet = Packet::find($id);

        if (!$packet) {
            return response()->json(['message' => 'Packet not found'], 404);
        }

        $questions = $packet->bankSoals()->orderBy('id')->get();

        $data = [
            'packet' => $packet,
            'questions' => $questions
        ];

        return response()->json([
            'payload' => self::encryptPayload(json_encode($data))
        ]);
    }
}
