#
# Cache based on django cacheback
#

from candidates.contacted.models import Contacted
from django_utils.cache import invalidation
from django_utils.cache.base import BaseModelCache


class ContactedCandidateListCache(BaseModelCache):
    model = Contacted
    prefetch_related = ('candidate__candidatejobtitle_set',)
    select_related = ('candidate__city',)

    def fetch(self, account_id, *args, **kwargs):
        return self.get_objects().filter(account_id=account_id)
	
    @classmethod
    def get_invalidation_attributes(cls, instance, *args, **kwargs):
        return {'account_id': instance.account_id}

	
invalidation.register(ContactedCandidateListCache)


#
# SERVICES
#

def get_account_contacted(account_id):
    """
    Returns queryset of Contacted with prefetch cities and categories for account
    :param account_id:
    :return: queryset
    """
    return ContactedCandidateListCache().get(account_id=account_id)


#
# MIXINS
#

from django.utils.translation import ugettext
import coreapi


class DynamicFieldsViewMixin:
    """
    View mixin that adds field list info to the serializer context
    """

    def get_serializer_context(self):
        context = super(DynamicFieldsViewMixin, self).get_serializer_context()
        context.update({
            'fields': self.request.query_params.get('fields'),
            'include': self.request.query_params.get('include')
        })
        return context

    @classmethod
    def get_GET_schema_fields(cls, view):
        """
        Dynamic list of options that field expects for Swagger
        :param view: DRF View instance
        :return: [Field, ...]
        """
        include_options = cls._get_include_options_line(view)

        fields_info = ugettext('List of the fields to restrict response data')
        include_info = ugettext(f'List of fields to include that are hidden by default. Available: {include_options}')

        return [
            coreapi.Field(name='fields', location='query', required=False, type='string', description=fields_info),
            coreapi.Field(name='include', location='query', required=False, type='string', description=include_info)
        ]

    @classmethod
    def _get_include_options_line(cls, view):
        fields = getattr(view.get_serializer(), 'INCLUDABLE_FIELDS', None)
        return ', '.join(fields) if fields else ''


#
# API
#

from django.conf import settings
from django.db import IntegrityError

from emails.transactional import ContactCandidateRequestEmailMessage
from rest_framework import generics
from rest_framework.exceptions import ParseError
from rest_framework.mixins import DestroyModelMixin
from rest_framework_extensions.mixins import NestedViewSetMixin

from accounts import permissions

from candidates.contacted import messages
from candidates.contacted.serializers import ContactedSerializer
from django_utils.api.mixins import MetaViewMixin
from django_utils.api.pagination import LimitPageNumberPagination


class ContactedListView(MetaViewMixin,
                        DynamicFieldsViewMixin,
                        NestedViewSetMixin,
                        DestroyModelMixin,
                        generics.ListCreateAPIView):
    """
    retrieve:
    Return the given candidate.

    list:
    Return a list of all the existing candidates.
    """
    serializer_class = ContactedSerializer
    pagination_class = LimitPageNumberPagination

    permission_classes = (permissions.UserAccountPermission, permissions.AccountApprovedPermission)

    def perform_create(self, serializer):
        try:
            contacted = serializer.save(account_id=self.request.user.account_id, contacted_by=self.request.user.id)
            self.send_email(contacted)
        except IntegrityError:
            raise ParseError(messages.CANDIDATE_IS_ALREADY_CONTACTED)

    def send_email(self, contacted):
        ContactCandidateRequestEmailMessage(
            from_email=settings.EMAIL_FROM_NO_REPLY,
            to=[settings.RELATIONSHIP_MANAGER_EMAIL],
            contacted=contacted,
            request=self.request
        ).send()

    def get_queryset(self):
        return get_account_contacted(self.request.user.account_id)