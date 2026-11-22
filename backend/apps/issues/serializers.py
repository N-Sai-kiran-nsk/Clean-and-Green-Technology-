from rest_framework import serializers
from .models import Issue, IssueAttachment, IssueComment
from apps.users.serializers import UserSerializer


def validate_image_file(value):
    content_type = (value.content_type or '').lower()
    if not content_type.startswith('image/'):
        raise serializers.ValidationError('Only image files are allowed.')
    if value.size > 10 * 1024 * 1024:
        raise serializers.ValidationError('Image must be 10 MB or smaller.')
    return value


class IssueCommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = IssueComment
        fields = ('id', 'issue', 'author', 'text', 'created_at', 'updated_at')


class IssueAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = IssueAttachment
        fields = ('id', 'issue', 'file', 'uploaded_at')

    def validate_file(self, value):
        return validate_image_file(value)


class IssueCreateSerializer(serializers.ModelSerializer):
    photo = serializers.FileField(write_only=True, required=False)
    photos = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Issue
        fields = ('id', 'title', 'description', 'status', 'priority', 'category', 'location', 'latitude', 'longitude', 'department', 'photo', 'photos')
        read_only_fields = ('id', 'status', 'priority')

    def validate_photo(self, value):
        return validate_image_file(value)

    def validate_photos(self, value):
        return [validate_image_file(photo) for photo in value]

    def create(self, validated_data):
        photos = list(validated_data.pop('photos', None) or [])
        photo = validated_data.pop('photo', None)
        if photo:
            photos.append(photo)
        issue = super().create(validated_data)
        for uploaded_file in photos:
            IssueAttachment.objects.create(issue=issue, file=uploaded_file)
        return issue


class IssueSerializer(serializers.ModelSerializer):
    reported_by = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    assigned_by = UserSerializer(read_only=True)
    attachments = IssueAttachmentSerializer(many=True, read_only=True)
    comments = IssueCommentSerializer(many=True, read_only=True)
    upvotes_count = serializers.SerializerMethodField()
    has_upvoted = serializers.SerializerMethodField()

    class Meta:
        model = Issue
        fields = (
            'id', 'title', 'description', 'status', 'priority', 'category',
            'location', 'latitude', 'longitude', 'reported_by', 'assigned_to',
            'assigned_at', 'assigned_by', 'department', 'created_at', 'updated_at',
            'resolved_at', 'attachments', 'comments', 'upvotes_count', 'has_upvoted'
        )
        read_only_fields = (
            'id', 'status', 'priority', 'reported_by', 'assigned_to',
            'assigned_at', 'assigned_by', 'created_at', 'updated_at',
            'resolved_at', 'attachments', 'comments', 'upvotes_count', 'has_upvoted',
        )

    def get_upvotes_count(self, obj):
        return obj.upvotes.count()

    def get_has_upvoted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.upvotes.filter(id=request.user.id).exists()
        return False
