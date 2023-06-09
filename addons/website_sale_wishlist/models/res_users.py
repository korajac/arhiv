from zira import api, fields, models
from zira.http import request


class ResUsers(models.Model):
    _inherit = "res.users"

    def _check_credentials(self, password):
        """Make all wishlists from session belong to its owner user."""
        result = super(ResUsers, self)._check_credentials(password)
        if request and request.session.get('wishlist_ids'):
            self.env["product.wishlist"]._check_wishlist_from_session()
        return result
