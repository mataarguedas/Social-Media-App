# /home/emma/app/backend/accounts/urls.py
from django.urls import path
from . import views # This import is still correct

urlpatterns = [
    # Use ClassName.as_view() for class-based views
    path('register/', views.RegisterView.as_view(), name='register'), 
    path('login/', views.LoginView.as_view(), name='login'),

    # You'll likely need a URL for your ProfileView too, e.g.:
    path('profile/', views.ProfileView.as_view(), name='profile'), 
]
