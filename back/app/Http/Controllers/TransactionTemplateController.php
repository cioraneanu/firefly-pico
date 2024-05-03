<?php

namespace App\Http\Controllers;

use App\Authorizations\TransactionTemplateAuthorization;
use App\Http\Controllers\Base\BaseController;
use App\Models\TransactionTemplate;
use App\Repositories\TransactionTemplateRepository;
use App\Validations\TransactionTemplateValidation;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;


class TransactionTemplateController extends BaseController
{
    //  ================================================================================
    //  ==============================   FIELDS   ======================================
    //  ================================================================================

    protected TransactionTemplateRepository $transactionTemplateRepository;

    //  ================================================================================
    //  ============================   CONSTRUCTOR   ===================================
    //  ================================================================================

    public function __construct(TransactionTemplateRepository $transactionTemplateRepository)
    {
        $this->transactionTemplateRepository = $transactionTemplateRepository;
    }

    //  ================================================================================
    //  ==============================   METHODS   =====================================
    //  ================================================================================

    public function getQuery()
    {
        $initialQuery = TransactionTemplate::query()->orderBy('name', 'asc');
        return QueryBuilder::for($initialQuery)
            ->allowedFilters([
                AllowedFilter::scope('search'),
            ]);
    }

    public function getOne(Request $request)
    {
        TransactionTemplateAuthorization::authorizeRead();
        $program = $this->getQuery()->findOrFail($request->id);
        $result = ['data' => $program];
        return $this->respond($result);
    }

    public function getAll(Request $request)
    {
        TransactionTemplateAuthorization::authorizeRead();

        $paginatedData = $this->getQuery()->paginate();
        $result = [
            'data' => $paginatedData->items(),
            'meta' => [
                'pagination' => [
                    'count' => $paginatedData->total(),
                    'current_page' => $paginatedData->currentPage(),
                    'per_page' => $paginatedData->perPage(),
                    'total' => $paginatedData->total(),
                    'total_pages' => $paginatedData->lastPage(),
                ]
            ]
        ];
        return $this->respond($result);
    }

    public function getTable(Request $request)
    {
        TransactionTemplateAuthorization::authorizeRead();
        $pageSize = request()->has('limit') ? request()->limit : 10;
        $response = $this->getQuery()->paginate($pageSize);
        return response()->json($response);
    }

    public function create(Request $request)
    {
        TransactionTemplateAuthorization::authorizeCreate();
        TransactionTemplateValidation::validateCreate($request);

        $program = $this->transactionTemplateRepository->createTransactionTemplate($request);
        $result = ['data' => $program];
        return $this->respondSuccessWithData($result);
    }

    public function update(Request $request)
    {
        TransactionTemplateAuthorization::authorizeUpdate();
        TransactionTemplateValidation::validateUpdate($request);

        $program = $this->transactionTemplateRepository->updateTransactionTemplate($request);
        $result = ['data' => $program];
        return $this->respondSuccessWithData($result);
    }

    public function delete(Request $request)
    {
        TransactionTemplateAuthorization::authorizeDelete();
        TransactionTemplateValidation::validateDelete($request);

        $program = $this->transactionTemplateRepository->deleteTransactionTemplate($request);
        return $this->respondSuccessWithData($program);
    }
}
