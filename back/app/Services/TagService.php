<?php

namespace App\Services;

use App\Exceptions\FireflyException;
use App\Exceptions\GeneralException;
use App\Http\Controllers\Base\BaseController;
use App\Http\Controllers\Base\BaseControllerFirefly;
use App\Models\Tag;

class TagService
{
    const COMPUTE_TOTAL_MAX_TRANSACTIONS = 500;
    const COMPUTE_TOTAL_PAGE_SIZE = 50;

    /**
     * Sum the tag's transactions from Firefly and persist the result on the tag.
     * Withdrawals count as money spent (+), deposits as refunds (-), transfers are ignored.
     * When the splits use multiple currencies, keep the currency with the most transactions.
     */
    public function computeTotal($tagId)
    {
        $tagUrl = config('app.firefly_url') . "/api/v1/tags/$tagId";
        $tagName = fget($this->getFromFirefly($tagUrl), 'data.attributes.tag');

        $transactionsUrl = "$tagUrl/transactions";
        $transactionsCount = fget($this->getFromFirefly($transactionsUrl, ['limit' => 1, 'page' => 1]), 'meta.pagination.total') ?? 0;

        if ($transactionsCount > self::COMPUTE_TOTAL_MAX_TRANSACTIONS) {
            throw new GeneralException("The task is too big. \"$tagName\" has $transactionsCount transactions (max " . self::COMPUTE_TOTAL_MAX_TRANSACTIONS . ").", BaseController::HTTP_CODE_UNPROCESSABLE_ENTITY);
        }

        [$totalAmount, $totalCurrencyId] = $this->sumTransactions($transactionsUrl, $tagName);

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

    // ---------------------------

    private function sumTransactions($transactionsUrl, $tagName)
    {
        $totals = [];
        $page = 1;
        do {
            $body = $this->getFromFirefly($transactionsUrl, ['limit' => self::COMPUTE_TOTAL_PAGE_SIZE, 'page' => $page]);

            foreach (fget($body, 'data') ?? [] as $transactionGroup) {
                foreach (fget($transactionGroup, 'attributes.transactions') ?? [] as $split) {
                    $this->addSplit($totals, $split, $tagName);
                }
            }

            $totalPages = fget($body, 'meta.pagination.total_pages') ?? 1;
            $page++;
        } while ($page <= $totalPages);

        $totalCurrencyId = null;
        foreach ($totals as $currencyId => $total) {
            if (!$totalCurrencyId || $total['count'] > $totals[$totalCurrencyId]['count']) {
                $totalCurrencyId = $currencyId;
            }
        }
        $totalAmount = $totalCurrencyId ? round($totals[$totalCurrencyId]['amount'], 2) : null;

        return [$totalAmount, $totalCurrencyId];
    }

    private function addSplit(&$totals, $split, $tagName)
    {
        if (!in_array($tagName, fget($split, 'tags') ?? [])) {
            return;
        }

        $sign = match (fget($split, 'type')) {
            'withdrawal' => 1,
            'deposit' => -1,
            default => 0,
        };
        if (!$sign) {
            return;
        }

        $currencyId = fget($split, 'currency_id');
        if (!isset($totals[$currencyId])) {
            $totals[$currencyId] = ['amount' => 0, 'count' => 0];
        }
        $totals[$currencyId]['amount'] += $sign * (float)fget($split, 'amount');
        $totals[$currencyId]['count']++;
    }

    private function getFromFirefly($url, $query = null)
    {
        $response = (new BaseControllerFirefly())->getHttpClient()->get($url, $query);
        if ($response->status() !== BaseController::HTTP_CODE_OK) {
            throw new FireflyException($response);
        }
        return $response->json();
    }
}
