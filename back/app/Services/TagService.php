<?php

namespace App\Services;

use App\Exceptions\GeneralException;
use App\Http\Controllers\Base\BaseController;
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

        $transactionsUrl = "$tagUrl/transactions";
        $transactionsCount = fget($transactionService->getFromFirefly($transactionsUrl, ['limit' => 1, 'page' => 1]), 'meta.pagination.total') ?? 0;

        if ($transactionsCount > TransactionService::COMPUTE_TOTAL_MAX_TRANSACTIONS) {
            throw new GeneralException("The task is too big. \"$tagName\" has $transactionsCount transactions (max " . TransactionService::COMPUTE_TOTAL_MAX_TRANSACTIONS . ").", BaseController::HTTP_CODE_UNPROCESSABLE_ENTITY);
        }

        $splitFilter = fn($split) => in_array($tagName, fget($split, 'tags') ?? []);
        [$totals] = $transactionService->sumTransactions($transactionsUrl, [], $splitFilter);
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
