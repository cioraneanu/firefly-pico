<?php

namespace App\Repositories;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class BaseRepository.
 */
abstract class BaseRepository
{
    const LOGICAL_OPERATION_AND = 'and';
    const LOGICAL_OPERATION_OR = 'or';

    const OPERATION_EQ = 'eq';
    const OPERATION_NE = 'ne';
    const OPERATION_GT = 'gt';
    const OPERATION_GE = 'ge';
    const OPERATION_LT = 'lt';
    const OPERATION_LE = 'le';
    const OPERATION_LK = 'lk';
    const OPERATION_IN = 'in';


    /**
     * The repository model.
     *
     * @var \Illuminate\Database\Eloquent\Model
     */
    protected $model;

    /**
     * The query builder.
     *
     * @var \Illuminate\Database\Eloquent\Builder
     */
    protected $query;

    /**
     * Alias for the query limit.
     *
     * @var int
     */
    protected $take;

    /**
     * Array of related models to eager load.
     *
     * @var array
     */
    protected $with = [];

    /**
     * Array of one or more where clause parameters.
     *
     * @var array
     */
    protected $wheres = [];

    /**
     * Array of one or more where in clause parameters.
     *
     * @var array
     */
    protected $whereIns = [];

    /**
     * Array of one or more ORDER BY column/value pairs.
     *
     * @var array
     */
    protected $orderBys = [];

    /**
     * Array of scope methods to call on the model.
     *
     * @var array
     */
    protected $scopes = [];

    /**
     * BaseRepository constructor.
     */
    public function __construct()
    {
        $this->makeModel();
    }

    /**
     * Specify Model class name.
     *
     * @return mixed
     */
    abstract public function model();

    /**
     * @return Model|mixed
     * @throws GeneralException
     */
    public function makeModel()
    {
        $model = app()->make($this->model());

        if (!$model instanceof Model) {
            throw new GeneralException("Class {$this->model()} must be an instance of " . Model::class);
        }

        return $this->model = $model;
    }

    public function getModel()
    {
        return $this->model;
    }

    public function bulkInsert($bulkData)
    {
        $model = $this->getModel();
        $data = collect($bulkData)->map(function ($item) {
            $newItem = collect($item);
            $newItem = $newItem->only($this->getFillableFields());
            $newItem = $newItem->merge(DataUtils::getTimestampColumns());
            return $newItem->toArray();
        });

        $ids = bulkInsertReturningIds2($model, $data);
        $list = $model::whereIn('id', $ids)->get();
        return $list;
    }

    public function bulkUpdate($bulkData) {
        // TODO: This could be made even more awesome with RAW sql bulk update.
        $model = $this->getModel();

        $latest = null;
        foreach ($bulkData as $currentData) {
            $item = $model::findOrFail($currentData['id']);

            $newItem = collect($currentData);
            $newItem = $newItem->only($this->getFillableFields());
            $newItem = $newItem->toArray();

            $newItem['updated_at'] = Carbon::now();
            $item->fill($newItem)->save();
            $latest = $item;
        }
        return $latest;
    }

    /**
     * Get all the model records in the database.
     *
     * @param array $columns
     *
     * @return Collection|static[]
     */
    public function all(array $columns = ['*'])
    {
        $this->newQuery()->eagerLoad();

        $models = $this->query->get($columns);

        $this->unsetClauses();

        return $models;
    }

    /**
     * Count the number of specified model records in the database.
     *
     * @return int
     */
    public function count(): int
    {
        return $this->get()->count();
    }

    /**
     * Create a new model record in the database.
     *
     * @param array $data
     *
     * @return \Illuminate\Database\Eloquent\Model
     */
    public function create(array $data)
    {
        $this->unsetClauses();

        return $this->model->create($data);
    }

    /**
     * Create one or more new model records in the database.
     *
     * @param array $data
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function createMultiple(array $data)
    {
        $models = new Collection();

        foreach ($data as $d) {
            $models->push($this->create($d));
        }

        return $models;
    }

    public function destroy($model)
    {
        if (!$model->delete()) {
            throw new GeneralException(__('exceptions.backend.posts.delete'));
        }
        return true;
    }

    /**
     * Delete one or more model records from the database.
     *
     * @return mixed
     */
    public function delete()
    {
        $this->newQuery()->setClauses()->setScopes();

        $result = $this->query->delete();

        $this->unsetClauses();

        return $result;
    }

    /**
     * Delete the specified model record from the database.
     *
     * @param $id
     *
     * @return bool|null
     * @throws \Exception
     */
    public function deleteById($id): bool
    {
        $this->unsetClauses();

        return $this->getById($id)->delete();
    }

    /**
     * Delete multiple records.
     *
     * @param array $ids
     *
     * @return int
     */
    public function deleteMultipleById(array $ids): int
    {
        return $this->model->destroy($ids);
    }

    /**
     * Get the first specified model record from the database.
     *
     * @param array $columns
     *
     * @return Model|static
     */
    public function first(array $columns = ['*'])
    {
        $this->newQuery()->eagerLoad()->setClauses()->setScopes();

        $model = $this->query->firstOrFail($columns);

        $this->unsetClauses();

        return $model;
    }

    /**
     * Get all the specified model records in the database.
     *
     * @param array $columns
     *
     * @return Collection|static[]
     */
    public function get(array $columns = ['*'])
    {
        $this->newQuery()->eagerLoad()->setClauses()->setScopes();

        $models = $this->query->get($columns);

        $this->unsetClauses();

        return $models;
    }

    /**
     * Get the specified model record from the database.
     *
     * @param       $id
     * @param array $columns
     *
     * @return Collection|Model
     */
    public function getById($id, array $columns = ['*'])
    {
        $this->unsetClauses();

        $this->newQuery()->eagerLoad();

        $item = $this->query->findOrFail($id, $columns);
        return $item;
    }

    /**
     * @param       $item
     * @param       $column
     * @param array $columns
     *
     * @return Model|null|static
     */
    public function getByColumn($item, $column, array $columns = ['*'])
    {
        $this->unsetClauses();

        $this->newQuery()->eagerLoad();

        return $this->query->where($column, $item)->first($columns);
    }

    /**
     * @param int $limit
     * @param array $columns
     * @param string $pageName
     * @param null $page
     *
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public function paginate($limit = 25, array $columns = ['*'], $pageName = 'page', $page = null)
    {
        $this->newQuery()->eagerLoad()->setClauses()->setScopes();

        $models = $this->query->paginate($limit, $columns, $pageName, $page);

        $this->unsetClauses();

        return $models;
    }

    /**
     * Update the specified model record in the database.
     *
     * @param       $id
     * @param array $data
     * @param array $options
     *
     * @return Collection|Model
     */
    public function updateById($id, array $data, array $options = [])
    {
        $this->unsetClauses();

        $model = $this->getById($id);

        $model->update($data, $options);

        return $model;
    }

    /**
     * Set the query limit.
     *
     * @param int $limit
     *
     * @return $this
     */
    public function limit($limit)
    {
        $this->take = $limit;

        return $this;
    }

    /**
     * Set an ORDER BY clause.
     *
     * @param string $column
     * @param string $direction
     * @return $this
     */
    public function orderBy($column, $direction = 'asc')
    {
        $this->orderBys[] = compact('column', 'direction');

        return $this;
    }

    /**
     * Add a simple where clause to the query.
     *
     * @param string $column
     * @param string $value
     * @param string $operator
     *
     * @return $this
     */
    public function where($column, $value, $operator = '=')
    {
        $this->wheres[] = compact('column', 'value', 'operator');

        return $this;
    }

    /**
     * Add a simple where in clause to the query.
     *
     * @param string $column
     * @param mixed $values
     *
     * @return $this
     */
    public function whereIn($column, $values)
    {
        $values = is_array($values) ? $values : [$values];

        $this->whereIns[] = compact('column', 'values');

        return $this;
    }

    /**
     * Set Eloquent relationships to eager load.
     *
     * @param $relations
     *
     * @return $this
     */
    public function with($relations)
    {
        if (is_string($relations)) {
            $relations = func_get_args();
        }

        $this->with = $relations;

        return $this;
    }

    /**
     * Create a new instance of the model's query builder.
     *
     * @return $this
     */
    protected function newQuery()
    {
        $this->query = $this->model->newQuery();

        return $this;
    }

    /**
     * Add relationships to the query builder to eager load.
     *
     * @return $this
     */
    protected function eagerLoad()
    {
        foreach ($this->with as $relation) {
            $this->query->with($relation);
        }

        return $this;
    }

    /**
     * Set clauses on the query builder.
     *
     * @return $this
     */
    protected function setClauses()
    {
        foreach ($this->wheres as $where) {
            $this->query->where($where['column'], $where['operator'], $where['value']);
        }

        foreach ($this->whereIns as $whereIn) {
            $this->query->whereIn($whereIn['column'], $whereIn['values']);
        }

        foreach ($this->orderBys as $orders) {
            $this->query->orderBy($orders['column'], $orders['direction']);
        }

        if (isset($this->take) and !is_null($this->take)) {
            $this->query->take($this->take);
        }

        return $this;
    }

    /**
     * Set query scopes.
     *
     * @return $this
     */
    protected function setScopes()
    {
        foreach ($this->scopes as $method => $args) {
            $this->query->$method(implode(', ', $args));
        }

        return $this;
    }

    /**
     * Reset the query clause parameter arrays.
     *
     * @return $this
     */
    protected function unsetClauses()
    {
        $this->wheres = [];
        $this->whereIns = [];
        $this->scopes = [];
        $this->take = null;

        return $this;
    }


    public function applyFiltersToQuery($query, $filters)
    {
        if ($filters) {
            foreach ($filters as $currentFilter) {
                $column = $currentFilter['column'];
                $operation = $currentFilter['operation'];
                $value = $currentFilter['value'];

                $logicalOperation = '';
                if (array_key_exists('logical_operation', $currentFilter))
                    if ($currentFilter['logical_operation'] == self::LOGICAL_OPERATION_OR)
                        $logicalOperation = self::LOGICAL_OPERATION_OR;

                if ($value != "") {
                    switch ($operation) {
                        case self::OPERATION_EQ:
                            $query = $query->{$logicalOperation . 'where'}($column, '=', $value);
                            break;
                        case self::OPERATION_NE:
                            $query = $query->{$logicalOperation . 'where'}($column, '<>', $value);
                            break;
                        case self::OPERATION_GT:
                            $query = $query->{$logicalOperation . 'where'}($column, '>', $value);
                            break;
                        case self::OPERATION_GE:
                            $query = $query->{$logicalOperation . 'where'}($column, '>=', $value);
                            break;
                        case self::OPERATION_LT:
                            $query = $query->{$logicalOperation . 'where'}($column, '<', $value);
                            break;
                        case self::OPERATION_LE:
                            $query = $query->{$logicalOperation . 'where'}($column, '<=', $value);
                            break;
                        case self::OPERATION_LK:
                            $query = $query->{$logicalOperation . 'whereRaw'}('LOWER(' . $column . ') like ?', ['%' . strtolower($value) . '%']);
                            break;
                        case self::OPERATION_IN:
                            $query = $query->{$logicalOperation . 'where'}($column, $value);
                            break;
                    }
                }
            }
        }
    }

    public function getTable($perPage = null, $sort = null, $filters = null, $baseQuery = null)
    {
        if ($baseQuery) {
            $query = $baseQuery;
        } else {
            $query = $this->model->newQuery();
        }

        // handle sort option
        if ($sort) {
            $query = $query->orderBy($sort['column'], $sort['direction']);
        } else {
            $query = $query->orderBy('id', 'asc');
        }
        $this->applyFiltersToQuery($query, $filters);

        $pagination = $query->paginate($perPage);
        $pagination->appends([
            'sort' => $sort,
            'filter' => $filters,
            'per_page' => $perPage
        ]);
        return $pagination;
    }

    public function getFillableFields()
    {
        return (new $this->model())->getFillable();
    }
}


