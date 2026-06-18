<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('bank_soals', function (Blueprint $table) {
            $table->id();
            $table->string('kategori', 10);
            $table->text('soal');
            $table->text('img_soal')->nullable();
            $table->text('a')->nullable();
            $table->text('b')->nullable();
            $table->text('c')->nullable();
            $table->text('d')->nullable();
            $table->text('e')->nullable();
            $table->text('img_a')->nullable();
            $table->text('img_b')->nullable();
            $table->text('img_c')->nullable();
            $table->text('img_d')->nullable();
            $table->text('img_e')->nullable();
            $table->char('kunci', 1);
            $table->text('jawaban_benar')->nullable();
            $table->integer('skor_a')->default(0);
            $table->integer('skor_b')->default(0);
            $table->integer('skor_c')->default(0);
            $table->integer('skor_d')->default(0);
            $table->integer('skor_e')->default(0);
            $table->text('pembahasan')->nullable();
            $table->text('gambar_pembahasan')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bank_soals');
    }
};
