from django.db import models
from django.contrib.auth.models import User 
from django.db.models.signals import post_save # Keep if you have signal receivers
from django.dispatch import receiver # Keep if you have signal receivers

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')

    # Existing fields (ensure profile_picture allows null/blank if needed)
    bio = models.TextField(max_length=500, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True) # Example using ImageField

    # --- NEW FIELDS ---
    full_name = models.CharField(max_length=100, blank=True) 
    date_of_birth = models.DateField(null=True, blank=True)
    location = models.CharField(max_length=100, blank=True) # Or consider using a more specific location field/library
    career = models.CharField(max_length=100, blank=True)
    college_start_date = models.DateField(null=True, blank=True)
    # --- END NEW FIELDS ---
    
    def __str__(self):
        return f"{self.user.username}'s profile"
