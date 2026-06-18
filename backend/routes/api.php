<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Auth Routes
Route::get('/auth/config', [App\Http\Controllers\Api\AuthController::class, 'config']);
Route::post('/auth/google', [App\Http\Controllers\Api\AuthController::class, 'googleLogin']);

// History Routes (Protected)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/history', [App\Http\Controllers\Api\HistoryController::class, 'index']);
    Route::post('/history', [App\Http\Controllers\Api\HistoryController::class, 'store']);
    Route::get('/leaderboard', [App\Http\Controllers\Api\HistoryController::class, 'leaderboard']);
});

Route::get('/soal', [App\Http\Controllers\Api\BankSoalController::class, 'index']);
Route::get('/packets', [App\Http\Controllers\Api\BankSoalController::class, 'packets']);
Route::get('/packets/{id}/soal', [App\Http\Controllers\Api\BankSoalController::class, 'packetQuestions']);

