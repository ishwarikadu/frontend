from django.contrib.auth.models import User
from rest_framework import serializers
from cloudinary.uploader import upload
from .models import Report, Match, Profile
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

class ReportSerializer(serializers.ModelSerializer):

    image = serializers.ImageField(write_only=True, required=False)

    reported_by_email = serializers.EmailField(
        source="reported_by.email",
        read_only=True
    )

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
            "reported_by_email"
        ]

        read_only_fields = [
            "image_url",
            "status",
            "is_matched",
            "created_at"
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
    reported_by_email = serializers.EmailField(
source="reported_by.email",
read_only=True
)

class MatchSerializer(serializers.ModelSerializer):

    lost_report = ReportSerializer(read_only=True)
    found_report = ReportSerializer(read_only=True)

    lost_reporter_email = serializers.EmailField(
        source="lost_report.reported_by.email",
        read_only=True
    )

    found_reporter_email = serializers.EmailField(
        source="found_report.reported_by.email",
        read_only=True
    )

    class Meta:
        model = Match
        fields = "__all__"
        read_only_fields = [
            "created_at",
            "status",
            "rejected_by_lost_reporter",
            "rejected_by_found_reporter",
            "is_resolved",
            "rejection_reason",
            "resolved_at",
            "resolved_by",
            "resolved_by_email",
            "id",
            "lost_report",
            "found_report"
        ]

class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

def create(self, validated_data):
    name = validated_data["name"]
    email = validated_data["email"]
    password = validated_data["password"]

    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=name
    )

    # Force default user
    Profile.objects.create(
        user=user,
        role="USER"
    )

    return user


class CustomTokenSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        data["name"] = self.user.first_name
        data["email"] = self.user.email
        data["role"] = "admin" if self.user.is_staff else "user"

        return data


