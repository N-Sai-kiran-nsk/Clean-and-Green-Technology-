from rest_framework import serializers
from .models import Issue, IssueAttachment, IssueComment
from apps.users.serializers import UserSerializer


class IssueCommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = IssueComment
        fields = ('id', 'issue', 'author', 'text', 'created_at', 'updated_at')


class IssueAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = IssueAttachment
        fields = ('id', 'issue', 'file', 'uploaded_at')


class IssueCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Issue
        fields = ('id', 'title', 'description', 'status', 'priority', 'category', 'location', 'latitude', 'longitude', 'department')
        read_only_fields = ('id',)

    def create(self, validated_data):
        validated_data['status'] = validated_data.get('status', 'open')
        validated_data['priority'] = validated_data.get('priority', 'medium')
        return super().create(validated_data)


class IssueSerializer(serializers.ModelSerializer):
    reported_by = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    attachments = IssueAttachmentSerializer(many=True, read_only=True)
    comments = IssueCommentSerializer(many=True, read_only=True)
    upvotes_count = serializers.SerializerMethodField()
    has_upvoted = serializers.SerializerMethodField()

    class Meta:
        model = Issue
        fields = (
            'id', 'title', 'description', 'status', 'priority', 'category',
            'location', 'latitude', 'longitude', 'reported_by', 'assigned_to',
            'department', 'created_at', 'updated_at', 'resolved_at', 'attachments', 'comments',
            'upvotes_count', 'has_upvoted'
        )

    def get_upvotes_count(self, obj):
        return obj.upvotes.count()

    def get_has_upvoted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.upvotes.filter(id=request.user.id).exists()
        return False
