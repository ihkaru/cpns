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

        return response()->json($soals);
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

        return response()->json([
            'packet' => $packet,
            'questions' => $questions
        ]);
    }
}
