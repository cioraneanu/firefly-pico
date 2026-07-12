<?php

namespace App\Services;

use App\Exceptions\FireflyException;
use App\Exceptions\GeneralException;
use App\Http\Controllers\Base\BaseController;
use App\Http\Controllers\Base\BaseControllerFirefly;

class TransactionService
{
    const COMPUTE_TOTAL_MAX_TRANSACTIONS = 500;
    const COMPUTE_TOTAL_PAGE_SIZE = 50;

    /**
     * Sum the transactions matched by a Firefly search query.
     * Withdrawals count as money spent (+), deposits as refunds (-), transfers are ignored.
     * When the splits use multiple currencies, keep the currency with the most transactions.
     */
    public function computeSearchTotal($query)
    {
        $searchUrl = config('app.firefly_url') . '/api/v1/search/transactions';

        $transactionsCount = fget($this->getFromFirefly($searchUrl, ['query' => $query, 'limit' => 1, 'page' => 1]), 'meta.pagination.total') ?? 0;

        if ($transactionsCount > self::COMPUTE_TOTAL_MAX_TRANSACTIONS) {
            throw new GeneralException("The task is too big. The search matches $transactionsCount transactions (max " . self::COMPUTE_TOTAL_MAX_TRANSACTIONS . ").", BaseController::HTTP_CODE_UNPROCESSABLE_ENTITY);
        }

        [$totalAmount, $totalCurrencyId] = $this->sumTransactions($searchUrl, ['query' => $query]);

        return [
            'total_amount' => $totalAmount,
            'total_currency_id' => $totalCurrencyId,
            'transactions_count' => $transactionsCount,
        ];
    }

    /**
     * Page through a Firefly transactions endpoint and sum the splits accepted by $splitFilter.
     * Returns [$totalAmount, $totalCurrencyId] where the currency is the one with the most transactions.
     */
    public function sumTransactions($transactionsUrl, $extraQuery = [], ?callable $splitFilter = null)
    {
        $totals = [];
        $page = 1;
        do {
            $body = $this->getFromFirefly($transactionsUrl, $extraQuery + ['limit' => self::COMPUTE_TOTAL_PAGE_SIZE, 'page' => $page]);

            foreach (fget($body, 'data') ?? [] as $transactionGroup) {
                foreach (fget($transactionGroup, 'attributes.transactions') ?? [] as $split) {
                    if ($splitFilter && !$splitFilter($split)) {
                        continue;
                    }
                    $this->addSplit($totals, $split);
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

    public function getFromFirefly($url, $query = null)
    {
        $response = (new BaseControllerFirefly())->getHttpClient()->get($url, $query);
        if ($response->status() !== BaseController::HTTP_CODE_OK) {
            throw new FireflyException($response);
        }
        return $response->json();
    }

    // ---------------------------

    private function addSplit(&$totals, $split)
    {
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
}
