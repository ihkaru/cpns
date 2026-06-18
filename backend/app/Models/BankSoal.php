<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BankSoal extends Model
{
    protected $guarded = [];

    public function packets()
    {
        return $this->belongsToMany(Packet::class, 'packet_bank_soal', 'bank_soal_id', 'packet_id');
    }
}
