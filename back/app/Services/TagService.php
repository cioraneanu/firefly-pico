<?php

namespace App\Services;

use App\Models\Tag;

class TagService
{
    /**
     * Sum the tag's transactions from Firefly and persist the result on the tag.
     * Withdrawals count as money spent (+), deposits as refunds (-), transfers are ignored.
     * When the splits use multiple currencies, keep the currency with the most transactions.
     */
    public function computeTotal($tagId)
    {
        $transactionService = app(TransactionService::class);

        $tagUrl = config('app.firefly_url') . "/api/v1/tags/$tagId";
        $tagName = fget($transactionService->getFromFirefly($tagUrl), 'data.attributes.tag');

        $splitFilter = fn($split) => in_array($tagName, fget($split, 'tags') ?? []);
        [$totals, $transactionsCount] = $transactionService->sumTransactions("$tagUrl/transactions", [], $splitFilter, TransactionService::COMPUTE_TOTAL_MAX_TRANSACTIONS);
        [$totalAmount, $totalCurrencyId] = TransactionService::dominantTotal($totals);

        Tag::updateOrCreate(['id' => $tagId], [
            'total_amount' => $totalAmount,
            'total_currency_id' => $totalCurrencyId,
        ]);

        return [
            'id' => $tagId,
            'total_amount' => $totalAmount,
            'total_currency_id' => $totalCurrencyId,
            'transactions_count' => $transactionsCount,
        ];
    }
}
