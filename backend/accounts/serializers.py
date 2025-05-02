# /home/emma/app/backend/accounts/serializers.py

from django.contrib.auth.models import User
from rest_framework import serializers
from django.core.exceptions import ValidationError
from django.conf import settings
from .models import Profile
# Import ImageField if you handle profile_picture as a file upload via serializer
# from rest_framework.fields import ImageField 

class ProfileSerializer(serializers.ModelSerializer):
    # If profile_picture is handled as a file upload, declare it explicitly
    # profile_picture = ImageField(max_length=None, use_url=True, required=False, allow_null=True)

    class Meta:
        model = Profile
        # Add the new fields from your Profile model
        fields = [
            'bio', 
            'profile_picture', 
            'full_name',             # New
            'date_of_birth',       # New
            'location',            # New
            'career',              # New
            'college_start_date'   # New
        ]
        # Make fields optional if needed for partial updates or initial creation
        extra_kwargs = {
            'bio': {'required': False},
            'profile_picture': {'required': False},
            'full_name': {'required': False},
            'date_of_birth': {'required': False},
            'location': {'required': False},
            'career': {'required': False},
            'college_start_date': {'required': False},
        }


class UserSerializer(serializers.ModelSerializer):
    # Use the updated ProfileSerializer for nested reading/writing
    profile = ProfileSerializer(required=False) 

    class Meta:
        model = User
        # Add 'first_name', 'last_name' if you want to use them instead of Profile.full_name
        # Or just use Profile.full_name via the nested serializer
        fields = ['id', 'username', 'email', 'password', 'profile'] 
        extra_kwargs = {'password': {'write_only': True, 'required': False}} # Password not required for updates

    def validate_email(self, value):
        # (Keep your existing email validation logic)
        domain = value.split('@')[-1]
        if domain not in settings.ALLOWED_EMAIL_DOMAINS:
             raise ValidationError(f"Tenés que registrate con uno correo de la U. Podés escoger: {', '.join(settings.ALLOWED_EMAIL_DOMAINS)}")
        
        request = self.context.get('request')
        user_instance = getattr(self, 'instance', None) # Get instance if it exists (for updates)

        # Check if email exists and belongs to a different user during updates
        if user_instance and User.objects.filter(email=value).exclude(pk=user_instance.pk).exists():
             raise ValidationError("Este correo electrónico ya está registrado por otro usuario.")
        # Check if email exists during creation
        elif not user_instance and User.objects.filter(email=value).exists():
             raise ValidationError("Este correo electrónico ya está registrado.")
             
        return value

    # create method remains largely the same, ensures profile is created
    def create(self, validated_data):
        profile_data = validated_data.pop('profile', {}) # Use {} as default
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''), # Email might be optional depending on your User model
            password=validated_data['password']
        )
        # Create profile with any nested data provided
        Profile.objects.create(user=user, **profile_data) 
        return user
        
    # Update method needs to handle nested profile updates more robustly
    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)
        
        # Update User fields (only if present in validated_data)
        instance.username = validated_data.get('username', instance.username)
        # instance.email = validated_data.get('email', instance.email) # Usually email isn't updated or requires re-verification
        # Password update only if provided
        if 'password' in validated_data:
            instance.set_password(validated_data['password'])
        instance.save()
        
        # Update Profile fields (handle if profile doesn't exist yet, though it should)
        # Use get_or_create for safety, though profile should exist for an authenticated user
        profile, created = Profile.objects.get_or_create(user=instance) 
        
        if profile_data is not None: # Check if profile data was sent in the request
            profile.full_name = profile_data.get('full_name', profile.full_name)
            profile.date_of_birth = profile_data.get('date_of_birth', profile.date_of_birth)
            profile.location = profile_data.get('location', profile.location)
            profile.career = profile_data.get('career', profile.career)
            profile.college_start_date = profile_data.get('college_start_date', profile.college_start_date)
            profile.bio = profile_data.get('bio', profile.bio)

            # Handle profile picture update - Check if 'profile_picture' key exists in profile_data
            # This assumes the picture is sent within the nested 'profile' object. 
            # If sent as a top-level field, adjust accordingly.
            # Set to None if explicitly sent as null to delete picture? Needs careful handling.
            if 'profile_picture' in profile_data:
                 profile.profile_picture = profile_data['profile_picture']

            profile.save()
            
        return instance