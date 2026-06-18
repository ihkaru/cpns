<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['user_id', 'name', 'score', 'max_score', 'passed', 'breakdown', 'duration_seconds'])]
class UserHistory extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'breakdown' => 'array',
            'passed' => 'boolean',
        ];
    }

    /**
     * Get the user that owns the history.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
