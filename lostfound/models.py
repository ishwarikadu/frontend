from django.db import models
from django.contrib.auth.models import User

#created class profile for 2 diff users student and staff
class Profile(models.Model):
    ROLE_CHOICES = [
        ("USER", "User"),
        ("ADMIN", "Admin"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)

    def __str__(self):
        return f"{self.user.username} ({self.role})"


# created class report to report lost and found items
class Report(models.Model):

    STATUS_CHOICES = [
        ("LOST", "Lost"),
        ("FOUND", "Found"),
        ("RETURNED", "Returned"),
    ]

    CATEGORY_CHOICES = [
        ("WALLET", "Wallet"),
        ("PHONE", "Phone"),
        ("BAG", "Bag"),
        ("LAPTOP", "Laptop"),
        ("BOOKS", "Books"),
        ("USB", "USB Drive"),
        ("OTHERS", "Others"),
    ]

    item_name = models.CharField(max_length=225, blank=True, null=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.TextField()
    date = models.DateField()
    location = models.CharField(max_length=200, default="Unknown Location")

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="LOST"
    )

    image_url = models.URLField(blank=True, null=True)
    image_public_id = models.CharField(max_length=255, blank=True, null=True)

    is_matched = models.BooleanField(default=False)
    reported_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

# created class match for admin approval system
class Match(models.Model):
    MATCH_STATUS = [
        ("PENDING", "Pending"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
    ]

    lost_report = models.ForeignKey(
        "Report", on_delete=models.CASCADE, related_name="lost_matches"
    )
    found_report = models.ForeignKey(
        "Report", on_delete=models.CASCADE, related_name="found_matches"
    )

    match_score = models.FloatField(default=0.0)
    reason = models.TextField(blank=True)

    status = models.CharField(max_length=10, choices=MATCH_STATUS, default="PENDING")

    approved_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="approved_matches"
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    

    def __str__(self):
        return f"Match {self.lost_report.id} ↔ {self.found_report.id} ({self.match_score})"

