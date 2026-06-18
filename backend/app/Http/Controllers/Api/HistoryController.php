<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserHistory;
use Illuminate\Http\Request;

class HistoryController extends Controller
{
    /**
     * Get learning history for the authenticated user.
     */
    public function index(Request $request)
    {
        $histories = UserHistory::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        // Map breakdown to match the CamelCase format frontend expects
        $formatted = $histories->map(function ($item) {
            return [
                'name' => $item->name,
                'date' => $item->created_at->setTimezone('Asia/Jakarta')->locale('id')->isoFormat('D MMM YYYY, HH:mm'),
                'score' => $item->score,
                'maxScore' => $item->max_score,
                'passed' => $item->passed,
                'breakdown' => $item->breakdown,
                'durationSeconds' => $item->duration_seconds
            ];
        });

        return response()->json($formatted);
    }

    /**
     * Store a new history record.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'score' => 'required|integer',
            'maxScore' => 'required|integer',
            'passed' => 'required|boolean',
            'breakdown' => 'required|array',
            'durationSeconds' => 'nullable|integer'
        ]);

        $history = UserHistory::create([
            'user_id' => $request->user()->id,
            'name' => $request->input('name'),
            'score' => $request->input('score'),
            'max_score' => $request->input('maxScore'),
            'passed' => $request->input('passed'),
            'breakdown' => $request->input('breakdown'),
            'duration_seconds' => $request->input('durationSeconds')
        ]);

        return response()->json($history, 201);
    }

    /**
     * Get the leaderboard (Top 10) and the current user's ranking.
     */
    public function leaderboard(Request $request)
    {
        $userId = $request->user()->id;

        // Raw SQL query executing PostgreSQL CTE and window functions to get best attempt per user ranked by BKN standard
        $results = \Illuminate\Support\Facades\DB::select("
            WITH best_attempts AS (
                SELECT 
                    user_id,
                    score,
                    max_score,
                    passed,
                    breakdown,
                    duration_seconds,
                    created_at,
                    ROW_NUMBER() OVER (
                        PARTITION BY user_id 
                        ORDER BY 
                            score DESC, 
                            CAST(breakdown->>'TKP' AS INTEGER) DESC NULLS LAST,
                            CAST(breakdown->>'TIU' AS INTEGER) DESC NULLS LAST,
                            CAST(breakdown->>'TWK' AS INTEGER) DESC NULLS LAST,
                            duration_seconds ASC NULLS LAST
                    ) as rn
                FROM user_histories
                WHERE name = 'Simulasi CAT SKD'
            ),
            ranked_users AS (
                SELECT 
                    user_id,
                    score,
                    max_score,
                    passed,
                    breakdown,
                    duration_seconds,
                    created_at,
                    ROW_NUMBER() OVER (
                        ORDER BY 
                            score DESC, 
                            CAST(breakdown->>'TKP' AS INTEGER) DESC NULLS LAST,
                            CAST(breakdown->>'TIU' AS INTEGER) DESC NULLS LAST,
                            CAST(breakdown->>'TWK' AS INTEGER) DESC NULLS LAST,
                            duration_seconds ASC NULLS LAST
                    ) as rank
                FROM best_attempts
                WHERE rn = 1
            )
            SELECT r.*, u.name as user_name, u.avatar_url
            FROM ranked_users r
            JOIN users u ON r.user_id = u.id
            ORDER BY r.rank ASC
        ");

        $leaderboard = collect($results)->take(10)->map(function ($item) {
            $breakdown = is_string($item->breakdown) ? json_decode($item->breakdown, true) : $item->breakdown;
            return [
                'rank' => (int) $item->rank,
                'userId' => (int) $item->user_id,
                'name' => $item->user_name,
                'avatarUrl' => $item->avatar_url,
                'score' => (int) $item->score,
                'maxScore' => (int) $item->max_score,
                'passed' => (bool) $item->passed,
                'breakdown' => $breakdown,
                'durationSeconds' => $item->duration_seconds !== null ? (int) $item->duration_seconds : null,
            ];
        });

        $currentUserRecord = collect($results)->firstWhere('user_id', $userId);
        $currentUserRank = null;
        if ($currentUserRecord) {
            $currentUserBreakdown = is_string($currentUserRecord->breakdown) ? json_decode($currentUserRecord->breakdown, true) : $currentUserRecord->breakdown;
            $currentUserRank = [
                'rank' => (int) $currentUserRecord->rank,
                'score' => (int) $currentUserRecord->score,
                'maxScore' => (int) $currentUserRecord->max_score,
                'passed' => (bool) $currentUserRecord->passed,
                'breakdown' => $currentUserBreakdown,
                'durationSeconds' => $currentUserRecord->duration_seconds !== null ? (int) $currentUserRecord->duration_seconds : null,
            ];
        }

        return response()->json([
            'leaderboard' => $leaderboard,
            'currentUser' => $currentUserRank
        ]);
    }
}
