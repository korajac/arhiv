# -*- coding: utf-8 -*-
from datetime import date, datetime

from zira.tests.common import Form, tagged

from zira.addons.hr_holidays.tests.common import TestHrHolidaysBase


@tagged('prout')
class TestAutomaticLeaveDates(TestHrHolidaysBase):
    def setUp(self):
        super(TestAutomaticLeaveDates, self).setUp()

        self.leave_type = self.env['hr.leave.type'].create({
            'name': 'Automatic Test',
            'time_type': 'leave',
            'allocation_type': 'no',
            'validity_start': False,
        })

    def test_no_attendances(self):
        calendar = self.env['resource.calendar'].create({
            'name': 'No Attendances',
            'attendance_ids': [(5, 0, 0)],
        })
        employee = self.employee_emp
        employee.resource_calendar_id = calendar

        with Form(self.env['hr.leave']) as leave_form:
            leave_form.employee_id = employee
            leave_form.holiday_status_id = self.leave_type
            leave_form.request_date_from = date(2019, 9, 2)
            leave_form.request_date_to = date(2019, 9, 2)
            leave_form.request_unit_half = True
            leave_form.request_date_from_period = 'am'

            self.assertEqual(leave_form.number_of_days_display, 0)
            self.assertEqual(leave_form.number_of_hours_display, 0)

    def test_single_attendance_on_morning_and_afternoon(self):
        calendar = self.env['resource.calendar'].create({
            'name': 'simple morning + afternoon',
            'attendance_ids': [(5, 0, 0),
                               (0, 0, {
                                   'name': 'monday morning',
                                   'hour_from': 8,
                                   'hour_to': 12,
                                   'day_period': 'morning',
                                   'dayofweek': '0',
                               }),
                               (0, 0, {
                                   'name': 'monday afternoon',
                                   'hour_from': 13,
                                   'hour_to': 17,
                                   'day_period': 'afternoon',
                                   'dayofweek': '0',
                               })]
        })

        employee = self.employee_emp
        employee.resource_calendar_id = calendar

        with Form(self.env['hr.leave']) as leave_form:
            leave_form.employee_id = employee
            leave_form.holiday_status_id = self.leave_type
            leave_form.request_date_from = date(2019, 9, 2)
            leave_form.request_date_to = date(2019, 9, 2)
            leave_form.request_unit_half = True
            leave_form.request_date_from_period = 'am'

            self.assertEqual(leave_form.number_of_days_display, .5)
            self.assertEqual(leave_form.number_of_hours_display, 4)

            leave_form.request_date_from_period = 'pm'

            self.assertEqual(leave_form.number_of_days_display, .5)
            self.assertEqual(leave_form.number_of_hours_display, 4)

    def test_multiple_attendance_on_morning(self):
        calendar = self.env['resource.calendar'].create({
            'name': 'multi morning',
            'attendance_ids': [(5, 0, 0),
                               (0, 0, {
                                   'name': 'monday morning 1',
                                   'hour_from': 8,
                                   'hour_to': 10,
                                   'day_period': 'morning',
                                   'dayofweek': '0',
                               }),
                               (0, 0, {
                                   'name': 'monday morning 2',
                                   'hour_from': 10.25,
                                   'hour_to': 12.25,
                                   'day_period': 'morning',
                                   'dayofweek': '0',
                               }),
                               (0, 0, {
                                   'name': 'monday afternoon',
                                   'hour_from': 13,
                                   'hour_to': 17,
                                   'day_period': 'afternoon',
                                   'dayofweek': '0',
                               })]
        })
        employee = self.employee_emp
        employee.resource_calendar_id = calendar

        with Form(self.env['hr.leave']) as leave_form:
            leave_form.employee_id = employee
            leave_form.holiday_status_id = self.leave_type
            leave_form.request_date_from = date(2019, 9, 2)
            leave_form.request_date_to = date(2019, 9, 2)
            leave_form.request_unit_half = True
            leave_form.request_date_from_period = 'am'

            self.assertEqual(leave_form.number_of_days_display, .5)
            self.assertEqual(leave_form.number_of_hours_display, 4)

            leave_form.request_date_from_period = 'pm'

            self.assertEqual(leave_form.number_of_days_display, .5)
            self.assertEqual(leave_form.number_of_hours_display, 4)

    def test_attendance_on_morning(self):
        calendar = self.env['resource.calendar'].create({
            'name': 'Morning only',
            'attendance_ids': [(5, 0, 0),
                               (0, 0, {
                                   'name': 'Monday All day',
                                   'hour_from': 8,
                                   'hour_to': 16,
                                   'day_period': 'morning',
                                   'dayofweek': '0',
                               })],
        })
        employee = self.employee_emp
        employee.resource_calendar_id = calendar
        with Form(self.env['hr.leave']) as leave_form:
            leave_form.employee_id = employee
            leave_form.holiday_status_id = self.leave_type
            leave_form.request_date_from = date(2019, 9, 2)
            leave_form.request_date_to = date(2019, 9, 2)
            leave_form.request_unit_half = True
            # Ask for morning
            leave_form.request_date_from_period = 'am'

            self.assertEqual(leave_form.number_of_days_display, 1)
            self.assertEqual(leave_form.number_of_hours_display, 8)

            # Ask for afternoon
            leave_form.request_date_from_period = 'pm'

            self.assertEqual(leave_form.number_of_days_display, 1)
            self.assertEqual(leave_form.number_of_hours_display, 8)

    def test_attendance_next_day(self):
        calendar = self.env['resource.calendar'].create({
            'name': 'auto next day',
            'attendance_ids': [(5, 0, 0),
                               (0, 0, {
                                   'name': 'tuesday morning',
                                   'hour_from': 8,
                                   'hour_to': 12,
                                   'day_period': 'morning',
                                   'dayofweek': '1',
                               })]
        })
        employee = self.employee_emp
        employee.resource_calendar_id = calendar

        with Form(self.env['hr.leave']) as leave_form:
            leave_form.employee_id = employee
            leave_form.holiday_status_id = self.leave_type
            leave_form.request_date_from = date(2019, 9, 2)
            leave_form.request_date_to = date(2019, 9, 2)
            leave_form.request_unit_half = True
            leave_form.request_date_from_period = 'am'


            self.assertEqual(leave_form.number_of_days_display, 0)
            self.assertEqual(leave_form.number_of_hours_display, 0)
            self.assertEqual(leave_form.date_from, datetime(2019, 9, 2, 6, 0, 0))
            self.assertEqual(leave_form.date_to, datetime(2019, 9, 2, 10, 0, 0))

    def test_attendance_previous_day(self):
        calendar = self.env['resource.calendar'].create({
            'name': 'auto next day',
            'attendance_ids': [(5, 0, 0),
                               (0, 0, {
                                   'name': 'monday morning',
                                   'hour_from': 8,
                                   'hour_to': 12,
                                   'day_period': 'morning',
                                   'dayofweek': '0',
                               })]
        })
        employee = self.employee_emp
        employee.resource_calendar_id = calendar

        with Form(self.env['hr.leave']) as leave_form:
            leave_form.employee_id = employee
            leave_form.holiday_status_id = self.leave_type
            leave_form.request_date_from = date(2019, 9, 3)
            leave_form.request_date_to = date(2019, 9, 3)
            leave_form.request_unit_half = True
            leave_form.request_date_from_period = 'am'


            self.assertEqual(leave_form.number_of_days_display, 0)
            self.assertEqual(leave_form.number_of_hours_display, 0)
            self.assertEqual(leave_form.date_from, datetime(2019, 9, 3, 6, 0, 0))
            self.assertEqual(leave_form.date_to, datetime(2019, 9, 3, 10, 0, 0))
