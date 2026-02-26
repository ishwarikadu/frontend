from django.contrib.auth.models import User
from rest_framework import serializers
from cloudinary.uploader import upload
from .models import Report, Match, Profile
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class ReportSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(write_only=True, required=False)

    class Meta:
        model = Report
        fields = [
            "id",
            "item_name",
            "category",
            "description",
            "date",
            "location",
            "image",
            "image_url",
            "status",
            "is_matched",
            "created_at",
        ]
        read_only_fields = [
            "image_url",
            "status",
            "is_matched",
            "created_at",
        ]
    def validate_image(self, image):
        # max size: 5MB
        if image.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Image size must be under 5MB.")

        allowed_types = ["image/jpeg", "image/png", "image/jpg"]
        if image.content_type not in allowed_types:
            raise serializers.ValidationError("Only JPG and PNG images are allowed.")

        return image

    def create(self, validated_data):
        image = validated_data.pop("image", None)

        if image:
            result = upload(image, folder="lost_found")
            validated_data["image_url"] = result.get("secure_url")
            validated_data["image_public_id"] = result.get("public_id")

        return super().create(validated_data)

class MatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Match
        fields = "__all__"
        read_only_fields = ["id", "created_at","approved_by", "approved_at"]


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=["user", "admin"])

    def create(self, validated_data):
        name = validated_data["name"]
        email = validated_data["email"]
        password = validated_data["password"]
        role = validated_data["role"]

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=name
        )
        if role == "admin":
            user.is_staff = True
            user.save()

        Profile.objects.create(
            user=user,
            role=role.upper()   
        )

        return user


class CustomTokenSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        data["name"] = self.user.first_name
        data["email"] = self.user.email
        data["role"] = self.user.profile.role

        return data

class CustomLoginView(TokenObtainPairView):
    serializer_class = CustomTokenSerializer
