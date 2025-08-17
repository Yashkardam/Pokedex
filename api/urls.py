from django.urls import path
from .views import PokemonProxyView, CompareView

urlpatterns = [
    path('pokemon/<str:identifier>/', PokemonProxyView.as_view()),
    path('compare/', CompareView.as_view()),
]