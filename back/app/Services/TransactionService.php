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
     * Sum the transactions matched by a Firefly search query, split per currency.
     * Withdrawals count as money spent (+), deposits as refunds (-), transfers are ignored.
     */
    public function computeSearchTotal($query)
    {
        $searchUrl = config('app.firefly_url') . '/api/v1/search/transactions';

        [$totals, $transactionsCount] = $this->sumTransactions($searchUrl, ['query' => $query], null, self::COMPUTE_TOTAL_MAX_TRANSACTIONS);

        $totals = array_map(function ($total) {
            $total['amount'] = round($total['amount'], 2);
            return $total;
        }, array_values($totals));

        return [
            'totals' => $totals,
            'transactions_count' => $transactionsCount,
        ];
    }

    /**
     * Page through a Firefly transactions endpoint and sum the splits accepted by $splitFilter.
     * Returns [$totals, $transactionsCount] where $totals is keyed by currency id.
     * The search endpoint's pagination meta counts are unreliable, so paging stops on a short
     * or empty page and $transactionsCount is counted from the actual fetched data.
     */
    public function sumTransactions($transactionsUrl, $extraQuery = [], ?callable $splitFilter = null, $maxTransactions = null)
    {
        $totals = [];
        $transactionsCount = 0;
        $page = 1;
        do {
            $body = $this->getFromFirefly($transactionsUrl, $extraQuery + ['limit' => self::COMPUTE_TOTAL_PAGE_SIZE, 'page' => $page]);
            $data = fget($body, 'data') ?? [];

            $transactionsCount += count($data);
            if ($maxTransactions && $transactionsCount > $maxTransactions) {
                throw new GeneralException("The task is too big. The search matches more than $maxTransactions transactions.", BaseController::HTTP_CODE_UNPROCESSABLE_ENTITY);
            }

            foreach ($data as $transactionGroup) {
                foreach (fget($transactionGroup, 'attributes.transactions') ?? [] as $split) {
                    if ($splitFilter && !$splitFilter($split)) {
                        continue;
                    }
                    $this->addSplit($totals, $split);
                }
            }

            $perPage = fget($body, 'meta.pagination.per_page') ?? self::COMPUTE_TOTAL_PAGE_SIZE;
            $totalPages = fget($body, 'meta.pagination.total_pages') ?? 1;
            $page++;
        } while ($page <= $totalPages && count($data) >= $perPage);

        return [$totals, $transactionsCount];
    }

    /**
     * Pick the total of the currency with the most transactions. Returns [$amount, $currencyId].
     */
    public static function dominantTotal($totals)
    {
        $dominant = null;
        foreach ($totals as $total) {
            if (!$dominant || $total['count'] > $dominant['count']) {
                $dominant = $total;
            }
        }
        return [$dominant ? round($dominant['amount'], 2) : null, $dominant['currency_id'] ?? null];
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
            $totals[$currencyId] = [
                'currency_id' => $currencyId,
                'currency_code' => fget($split, 'currency_code'),
                'amount' => 0,
                'count' => 0,
            ];
        }
        $totals[$currencyId]['amount'] += $sign * (float)fget($split, 'amount');
        $totals[$currencyId]['count']++;
    }
}
