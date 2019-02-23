# Запросы на
## `connect` Соединение к Manager

## `node-get-list` Запросить список нод
  ```json
  { type: 'node-get-list' }
  ```

## `node-create` Запросить хеш нод на сервере
## `node-update` Запросить хеш нод на сервере
## `node-delete` Запросить хеш нод на сервере
## `link-get-list` Запросить список линков
  ```json
  { type: 'link-get-list' }
  ```

## `link-create` Запросить хеш нод на сервере
## `link-delete` Запросить хеш нод на сервере

# Запросы от
## `node-list` Список линков
  ```json
  {
    type: 'node-list',
    nodes: []
  }
  ```

## `node-created` Запросить хеш нод на сервере
## `node-updated` Запросить хеш нод на сервере
## `node-deleted` Запросить мигзацию ноды у сервера
## `link-list` Список линков
  ```json
  {
    type: 'link-list',
    links: []
  }
  ```

## `link-created` Запросить хеш нод на сервере
## `link-deleted` Запросить мигзацию ноды у сервера
  * Параметры
    ```json
    [
      id: String,
      ...
    ]
    ```
