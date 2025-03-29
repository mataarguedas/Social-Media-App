from django.contrib.auth.models import User
from rest_framework import serializers
from django.core.exceptions import ValidationError
from django.conf import settings
from .models import Profile

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['bio', 'profile_picture']

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(required=False)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'profile']
        extra_kwargs = {'password': {'write_only': True}}

    def validate_email(self, value):
        # First, check if the email domain is allowed
        domain = value.split('@')[-1]
        if domain not in settings.ALLOWED_EMAIL_DOMAINS:
            raise ValidationError(f"Tenés que registrate con uno correo de la U. Podés escoger: {', '.join(settings.ALLOWED_EMAIL_DOMAINS)}")
        
        # Check if this email exists but belongs to a different user
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # If this is an update operation (user exists)
            existing_user = User.objects.filter(email=value).exclude(pk=request.user.pk).first()
            if existing_user:
                raise ValidationError("Este correo electrónico ya está registrado.")
        else:
            # If this is a create operation (new user)
            if User.objects.filter(email=value).exists():
                raise ValidationError("Este correo electrónico ya está registrado.")
        
        return value

    def create(self, validated_data):
        profile_data = validated_data.pop('profile', None)
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        
        if profile_data:
            Profile.objects.create(user=user, **profile_data)
        else:
            Profile.objects.create(user=user)
            
        return user
        
    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)
        
        # Update User model fields
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        if 'password' in validated_data:
            instance.set_password(validated_data['password'])
        instance.save()
        
        # Update or create Profile
        if profile_data:
            profile, created = Profile.objects.get_or_create(user=instance)
            profile.bio = profile_data.get('bio', profile.bio)
            if 'profile_picture' in profile_data:
                profile.profile_picture = profile_data['profile_picture']
            profile.save()
            
        return instance