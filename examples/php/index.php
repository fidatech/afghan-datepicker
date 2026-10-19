<?php
declare(strict_types=1);
$message = '';
$selected = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $value = trim((string) ($_POST['invoice_date'] ?? ''));
    $parsed = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
    if ($parsed !== false && $parsed->format('Y-m-d') === $value) {
        $selected = $value;
        $message = 'Saved Gregorian date: ' . $value;
    } else {
        $message = 'Invalid date. Expected YYYY-MM-DD.';
    }
}
function escape(string $value): string {
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Afghan Datepicker · Core PHP</title>
  <link rel="stylesheet" href="/src/datepicker.css">
  <style>body{font:15px system-ui;max-width:480px;margin:60px auto;padding:18px;color:#102b3f}label{display:block;margin-bottom:8px}button{margin-top:15px;padding:10px 20px;border:0;background:#102b3f;color:white;border-radius:8px}p{color:#f77700}</style>
</head>
<body>
  <h1>Afghan Datepicker · Core PHP</h1>
  <?php if ($message): ?><p role="status"><?= escape($message) ?></p><?php endif; ?>
  <form method="post">
    <label for="invoice_date">Invoice date</label>
    <input id="invoice_date" name="invoice_date" value="<?= escape($selected) ?>">
    <button type="submit">Save</button>
  </form>
  <script src="/dist/afghan-datepicker.global.js"></script>
  <script>
    new window.AfghanDatepicker('#invoice_date', {
      locale: 'ps-AF', calendar: 'jalali', theme: 'light'
    });
  </script>
</body>
</html>
