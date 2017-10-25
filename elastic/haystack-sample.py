# ********************* Haystack *****************************

# ==== Index ======

class BookingIndex(indexes.ModelSearchIndex, indexes.Indexable):
    booking_id = indexes.CharField(model_attr='booking_id', indexed=False, null=True)
    product_id = index_fields.BookingProductID(indexed=False, null=True)
    product_type = indexes.CharField(model_attr='booking_type', indexed=False)
    passenger_full_name = index_fields.BookingPassengerFullNameField(indexed=False, null=True)
    status = indexes.CharField(model_attr='status', indexed=False, null=True)
    passenger_phone = index_fields.BookingPassengerPhoneField(indexed=False, null=True)
    created_date = TimeZoneDateTimeField(model_attr='created')
    modified = TimeZoneDateTimeField(model_attr='modified')
    product_name = index_fields.BookingProductNameField(indexed=False, language='en', null=True)
    product_name_cn = index_fields.BookingProductNameField(indexed=False, language='zh-cn', null=True)
    departure_date = index_fields.BookingDepartureDateField(null=True)
    affiliate_id = indexes.IntegerField(model_attr='affiliate_id', null=True)
    customer_user_id = indexes.IntegerField(model_attr='customer_user_id', null=True)
    amount = indexes.FloatField(model_attr='amount', null=True)
    payment_due = TimeZoneDateTimeField(model_attr='payment_due', null=True)
    contact_info = index_fields.BookingContactInfoField(indexed=False)
    parent_destinations = index_fields.ParentDestinationsJsonField(indexed=False)
    days = index_fields.BookingDaysField(indexed=False)
    nights = index_fields.BookingNightsField(indexed=False)
    departure_city_name = index_fields.BookingDepartureCityField(indexed=False, language='en')
    departure_city_name_cn = index_fields.BookingDepartureCityField(indexed=False, language='zh-cn')

    class Meta:
        model = models.Booking

    def update_object(self, instance, using=None, **kwargs):
        # don't update booking with incomplete data
        if not instance.specific_booking:
            return
        super(BookingIndex, self).update_object(instance, using, **kwargs)


# ====== Custom index fields example ========

class BookingDaysField(BookingDetailServiceMixin, indexes.IntegerField):
    def prepare(self, obj):
        service = self.get_detail_service(obj)
        return service.get_days()


class BookingNightsField(BookingDetailServiceMixin, indexes.IntegerField):
    def prepare(self, obj):
        service = self.get_detail_service(obj)
        return service.get_nights()


class BookingDepartureCityField(BookingDetailServiceMixin, indexes.CharField):
    """
    Index departure city name
    """
    def __init__(self, *args, **kwargs):
        self.language = kwargs.pop('language', 'zh-cn')
        super(BookingDepartureCityField, self).__init__(**kwargs)

    def prepare(self, obj):
        service = self.get_detail_service(obj)
        city = service.get_departure_city()
        return city.get_name_for_language(self.language) if city else ''