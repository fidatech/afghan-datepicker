from django.urls import path
from .views import datepicker

urlpatterns = [path("", datepicker, name="datepicker")]
