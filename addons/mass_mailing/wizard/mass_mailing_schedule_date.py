# -*- coding: utf-8 -*-
# Part of Zira. See LICENSE file for full copyright and licensing details.

from zira import api, fields, models, _
from zira.exceptions import ValidationError


class MassMailingScheduleDate(models.TransientModel):
    _name = 'mass.mailing.schedule.date'
    _description = 'Mass Mailing Scheduling'

    schedule_date = fields.Datetime(string='Schedule in the Future')
    mass_mailing_id = fields.Many2one('mail.mass_mailing', required=True)

    @api.constrains('schedule_date')
    def _check_schedule_date(self):
        for scheduler in self:
            if scheduler.schedule_date < fields.Datetime.now():
                raise ValidationError(_('Please select a date equal/or greater than the current date.'))

    def set_schedule_date(self):
        self.mass_mailing_id.write({'schedule_date': self.schedule_date, 'state': 'in_queue'})
