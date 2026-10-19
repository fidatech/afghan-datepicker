<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Afghan Datepicker · Laravel</title>
  <link rel="stylesheet" href="{{ asset('vendor/afghan-datepicker/datepicker.css') }}">
</head>
<body style="font:15px system-ui;max-width:460px;margin:60px auto">
  <h1>Afghan Datepicker in Laravel</h1>
  @if(session('message'))<p role="status">{{ session('message') }}</p>@endif
  <form action="/afghan-datepicker" method="post">
    @csrf
    <label for="invoice_date">Invoice date</label>
    <input id="invoice_date" name="invoice_date" value="{{ old('invoice_date') }}">
    @error('invoice_date')<p role="alert">{{ $message }}</p>@enderror
    <p><button type="submit">Save</button></p>
  </form>
  <script src="{{ asset('vendor/afghan-datepicker/afghan-datepicker.global.js') }}"></script>
  <script>
    new window.AfghanDatepicker('#invoice_date', {
      locale: 'fa-AF',
      calendar: 'jalali',
      theme: 'light'
    });
  </script>
</body>
</html>
