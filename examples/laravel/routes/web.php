<?php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::view('/afghan-datepicker', 'datepicker');

Route::post('/afghan-datepicker', function (Request $request) {
    $data = $request->validate([
        'invoice_date' => ['required', 'date_format:Y-m-d'],
    ]);
    // Your app can save the Gregorian YYYY-MM-DD value in a DATE column.
    return back()->with('message', 'Validated: ' . $data['invoice_date'])
                 ->withInput();
});
