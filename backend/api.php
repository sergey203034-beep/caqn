<?php
/* ===================================================================
   «Лакомый кусочек» — бэкенд общей базы данных (замена Supabase)
   -------------------------------------------------------------------
   Работает на обычном PHP + MySQL хостинге. Поддерживает 4 таблицы:
   cakes, users, orders, settings — с теми же полями, что использует
   сайт (js/data.js).

   Запросы:
     GET  api.php?table=cakes            -> [...] список строк
     POST api.php  { key, table, action: 'upsert', rows: [...] }
     POST api.php  { key, table, action: 'delete', ids: [...] }
   =================================================================== */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require __DIR__ . '/db-config.php';

function fail($message, $code = 400) {
  http_response_code($code);
  echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE);
  exit;
}

$mysqli = @new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
if ($mysqli->connect_error) {
  fail('Не удалось подключиться к базе данных: ' . $mysqli->connect_error, 500);
}
$mysqli->set_charset('utf8mb4');

/* Описание таблиц: разрешённые колонки и их тип (для правильной
   сборки запроса). 'json' поля хранятся как JSON-текст. */
$SCHEMAS = [
  'cakes' => [
    'pk' => 'id',
    'columns' => [
      'id' => 'string', 'name' => 'string', 'category' => 'string',
      'weight' => 'number', 'tiers' => 'number', 'price' => 'number',
      'available' => 'bool', 'description' => 'string', 'media' => 'json'
    ]
  ],
  'users' => [
    'pk' => 'id',
    'columns' => [
      'id' => 'string', 'name' => 'string', 'email' => 'string',
      'password' => 'string', 'role' => 'string', 'addresses' => 'json'
    ]
  ],
  'orders' => [
    'pk' => 'id',
    'columns' => [
      'id' => 'string', 'userId' => 'string', 'items' => 'json',
      'total' => 'number', 'status' => 'string', 'date' => 'string',
      'deliveryDate' => 'string', 'name' => 'string', 'phone' => 'string',
      'address' => 'string', 'comment' => 'string'
    ]
  ],
  'settings' => [
    'pk' => 'id',
    'columns' => ['id' => 'number', 'social' => 'json', 'contact' => 'json']
  ],
  'support_chats' => [
    'pk' => 'id',
    'columns' => [
      'id' => 'string', 'visitorId' => 'string', 'name' => 'string',
      'messages' => 'json', 'unreadForAdmin' => 'bool', 'unreadForUser' => 'bool',
      'updatedAt' => 'number'
    ]
  ]
];

function readRow($row, $schema) {
  foreach ($schema['columns'] as $col => $type) {
    if (!array_key_exists($col, $row)) continue;
    if ($type === 'json') {
      $row[$col] = $row[$col] === null ? null : json_decode($row[$col], true);
    } elseif ($type === 'bool') {
      $row[$col] = (bool) $row[$col];
    } elseif ($type === 'number') {
      $row[$col] = $row[$col] === null ? null : $row[$col] + 0;
    }
  }
  return $row;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  $table = $_GET['table'] ?? '';
  if (!isset($SCHEMAS[$table])) fail('Неизвестная таблица: ' . $table);
  $schema = $SCHEMAS[$table];

  $result = $mysqli->query("SELECT * FROM `$table`");
  if (!$result) fail('Ошибка выборки: ' . $mysqli->error, 500);

  $rows = [];
  while ($row = $result->fetch_assoc()) { $rows[] = readRow($row, $schema); }
  echo json_encode($rows, JSON_UNESCAPED_UNICODE);
  exit;
}

if ($method === 'POST') {
  $body = json_decode(file_get_contents('php://input'), true);
  if (!is_array($body)) fail('Некорректное тело запроса');

  if (!hash_equals(API_KEY, (string) ($body['key'] ?? ''))) {
    fail('Неверный ключ доступа', 403);
  }

  $table = $body['table'] ?? '';
  if (!isset($SCHEMAS[$table])) fail('Неизвестная таблица: ' . $table);
  $schema = $SCHEMAS[$table];
  $action = $body['action'] ?? '';

  if ($action === 'delete') {
    $ids = $body['ids'] ?? [];
    if (!is_array($ids) || count($ids) === 0) { echo json_encode(['ok' => true]); exit; }
    $pk = $schema['pk'];
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $mysqli->prepare("DELETE FROM `$table` WHERE `$pk` IN ($placeholders)");
    $types = str_repeat('s', count($ids));
    $stmt->bind_param($types, ...$ids);
    if (!$stmt->execute()) fail('Ошибка удаления: ' . $stmt->error, 500);
    echo json_encode(['ok' => true]);
    exit;
  }

  if ($action === 'upsert') {
    $rows = $body['rows'] ?? [];
    if (!is_array($rows)) fail('rows должен быть массивом');

    foreach ($rows as $row) {
      $cols = [];
      $placeholders = [];
      $values = [];
      $types = '';
      $updates = [];

      foreach ($schema['columns'] as $col => $type) {
        if (!array_key_exists($col, $row)) continue;
        $cols[] = "`$col`";
        $placeholders[] = '?';
        $val = $row[$col];
        if ($type === 'json') {
          $values[] = json_encode($val, JSON_UNESCAPED_UNICODE);
          $types .= 's';
        } elseif ($type === 'bool') {
          $values[] = $val ? 1 : 0;
          $types .= 'i';
        } elseif ($type === 'number') {
          $values[] = $val === null || $val === '' ? null : (float) $val;
          $types .= 'd';
        } else {
          $values[] = $val === null ? null : (string) $val;
          $types .= 's';
        }
        if ($col !== $schema['pk']) { $updates[] = "`$col` = VALUES(`$col`)"; }
      }

      if (count($cols) === 0) continue;

      $sql = "INSERT INTO `$table` (" . implode(',', $cols) . ") VALUES (" . implode(',', $placeholders) . ")"
        . " ON DUPLICATE KEY UPDATE " . (count($updates) ? implode(',', $updates) : $schema['pk'] . '=' . $schema['pk']);

      $stmt = $mysqli->prepare($sql);
      if (!$stmt) fail('Ошибка подготовки запроса: ' . $mysqli->error, 500);
      $stmt->bind_param($types, ...$values);
      if (!$stmt->execute()) fail('Ошибка сохранения: ' . $stmt->error, 500);
    }

    echo json_encode(['ok' => true]);
    exit;
  }

  fail('Неизвестное действие: ' . $action);
}

fail('Метод не поддерживается', 405);
