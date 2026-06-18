<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\File;

class AuthController extends Controller
{
    /**
     * Get Google Client ID configuration.
     */
    public function config()
    {
        return response()->json([
            'googleClientId' => env('GOOGLE_CLIENT_ID')
        ]);
    }

    /**
     * Authenticate or register a user with Google ID Token.
     */
    public function googleLogin(Request $request)
    {
        $request->validate([
            'idToken' => 'required|string'
        ]);

        $idToken = $request->input('idToken');
        $googleUser = null;

        // Dev/Demo bypass
        if ($idToken === 'demo-token') {
            $googleUser = [
                'sub' => 'demo-google-sub-123456',
                'email' => 'demo-user@aksaracat.local',
                'name' => 'Peserta CPNS Demo',
                'picture' => null
            ];
        } else {
            // Verify ID Token via Google API
            $url = "https://oauth2.googleapis.com/tokeninfo?id_token=" . urlencode($idToken);
            $response = Http::get($url);

            if (!$response->successful()) {
                return response()->json([
                    'error' => 'Invalid Google ID token.'
                ], 401);
            }

            $payload = $response->json();

            // Verify audience matches
            $clientId = env('GOOGLE_CLIENT_ID');
            if ($clientId && isset($payload['aud']) && $payload['aud'] !== $clientId) {
                return response()->json([
                    'error' => 'Token audience mismatch.'
                ], 401);
            }

            if (isset($payload['email_verified']) && $payload['email_verified'] !== 'true' && $payload['email_verified'] !== true) {
                return response()->json([
                    'error' => 'Email not verified.'
                ], 401);
            }

            $googleUser = [
                'sub' => $payload['sub'],
                'email' => $payload['email'],
                'name' => $payload['name'] ?? 'Google User',
                'picture' => $payload['picture'] ?? null
            ];
        }

        // Save avatar locally to prevent CORS or rate limits
        $localAvatarUrl = $googleUser['picture'];
        if ($googleUser['picture'] && !str_contains($googleUser['picture'], 'default-user')) {
            try {
                $avatarResponse = Http::get($googleUser['picture']);
                if ($avatarResponse->successful()) {
                    $avatarsDir = public_path('avatars');
                    if (!File::exists($avatarsDir)) {
                        File::makeDirectory($avatarsDir, 0755, true);
                    }
                    $filename = $googleUser['sub'] . '.jpg';
                    File::put($avatarsDir . '/' . $filename, $avatarResponse->body());
                    $localAvatarUrl = asset('avatars/' . $filename);
                }
            } catch (\Exception $e) {
                logger()->error("Failed to download local avatar: " . $e->getMessage());
            }
        }

        // Upsert user
        $user = User::where('google_sub', $googleUser['sub'])->first();

        if ($user) {
            $user->update([
                'email' => $googleUser['email'],
                'name' => $googleUser['name'],
                'avatar_url' => $localAvatarUrl,
            ]);
        } else {
            $user = User::create([
                'google_sub' => $googleUser['sub'],
                'email' => $googleUser['email'],
                'name' => $googleUser['name'],
                'avatar_url' => $localAvatarUrl,
                'password' => bcrypt(Str::random(16)) // Random dummy password for safety
            ]);
        }

        // Issue Sanctum token
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'avatarUrl' => $user->avatar_url,
            ]
        ]);
    }
}
