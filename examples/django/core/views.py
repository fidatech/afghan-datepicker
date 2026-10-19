from datetime import date

from django.shortcuts import render


def datepicker(request):
    value = ""
    message = ""
    if request.method == "POST":
        candidate = request.POST.get("invoice_date", "")
        try:
            # date.fromisoformat is stricter than accepting a display-formatted date.
            parsed = date.fromisoformat(candidate)
            if parsed.isoformat() != candidate:
                raise ValueError("Non-canonical format")
            value = parsed.isoformat()
            message = f"Validated: {value}"
        except ValueError:
            message = "Invalid date. Expected Gregorian YYYY-MM-DD."
    return render(request, "datepicker.html", {"date_value": value, "message": message})
