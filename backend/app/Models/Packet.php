<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Packet extends Model
{
    protected $guarded = [];

    public function bankSoals()
    {
        return $this->belongsToMany(BankSoal::class, 'packet_bank_soal', 'packet_id', 'bank_soal_id');
    }
}
