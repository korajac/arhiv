from unittest.mock import MagicMock

checkout_session_signature = 't=1591264652,v1=1f0d3e035d8de956396b1d91727267fbbf483253e7702e46357b4d2bfa078ba4,v0=20d76342f4704d49f8f89db03acff7cf04afa48ca70a22d608b4649b332c1f51'
checkout_session_body = b'{\n  "id": "evt_1GqFpHAlCFm536g8NYSLoccF",\n  "object": "event",\n  "api_version": "2019-05-16",\n  "created": 1591264651,\n  "data": {\n    "object": {\n      "id": "cs_test_SI8yz61JCZ4gxd7Z5oGfQSn9ZbubC6SZF3bJTxvy2PVqSd3dzbDV1kyd",\n      "object": "checkout.session",\n      "billing_address_collection": null,\n      "cancel_url": "https://httpbin.org/post",\n      "client_reference_id": null,\n      "customer": "cus_HP3xLqXMIwBfTg",\n      "customer_email": null,\n      "display_items": [\n        {\n          "amount": 1500,\n          "currency": "usd",\n          "custom": {\n            "description": "comfortable cotton t-shirt",\n            "images": null,\n            "name": "t-shirt"\n          },\n          "quantity": 2,\n          "type": "custom"\n        }\n      ],\n      "livemode": false,\n      "locale": null,\n      "metadata": {\n      },\n      "mode": "payment",\n      "payment_intent": "pi_1GqFpCAlCFm536g8HsBSvSEt",\n      "payment_method_types": [\n        "card"\n      ],\n      "setup_intent": null,\n      "shipping": null,\n      "shipping_address_collection": null,\n      "submit_type": null,\n      "subscription": null,\n      "success_url": "https://httpbin.org/post"\n    }\n  },\n  "livemode": false,\n  "pending_webhooks": 2,\n  "request": {\n    "id": null,\n    "idempotency_key": null\n  },\n  "type": "checkout.session.completed"\n}'

checkout_session_object = {'billing_address_collection': None,
                           'cancel_url': 'https://httpbin.org/post',
                           'client_reference_id': "tx_ref_test_handle_checkout_webhook",
                           'customer': 'cus_HOgyjnjdgY6pmY',
                           'customer_email': None,
                           'display_items': [{'amount': 1500,
                                              'currency': 'usd',
                                              'custom': {'description': 'comfortable '
                                                                        'cotton '
                                                                        't-shirt',
                                                         'images': None,
                                                         'name': 't-shirt'},
                                              'quantity': 2,
                                              'type': 'custom'}],
                           'id': 'cs_test_sbTG0yGwTszAqFUP8Ulecr1bUwEyQEo29M8taYvdP7UA6Qr37qX6uA6w',
                           'livemode': False,
                           'locale': None,
                           'metadata': {},
                           'mode': 'payment',
                           'object': 'checkout.session',
                           'payment_intent': 'pi_1GptaRAlCFm536g8AfCF6Zi0',
                           'payment_method_types': ['card'],
                           'setup_intent': None,
                           'shipping': None,
                           'shipping_address_collection': None,
                           'submit_type': None,
                           'subscription': None,
                           'success_url': 'https://httpbin.org/post'}

missing_tx_resp = MagicMock()
missing_tx_resp.ok = False
missing_tx_resp.status_code = 404
missing_tx_resp.json.return_value = {
    'error': {
        'code': 'resource_missing',
        'doc_url': 'https://stripe.com/docs/error-codes/resource-missing',
        'message': "No such payment_intent: 'False'",
        'param': 'intent',
        'type': 'invalid_request_error'
    }
}

wrong_amount_tx_resp = MagicMock()
wrong_amount_tx_resp.ok = True
wrong_amount_tx_resp.json.return_value = {'id': 'pi_1IjSc5AlCFm536g8geIfiu2u', 'object': 'payment_intent', 'amount': 1000, 'amount_capturable': 0, 'amount_received': 1000, 'application': None, 'application_fee_amount': None, 'canceled_at': None, 'cancellation_reason': None, 'capture_method': 'automatic', 'charges': {'object': 'list', 'data': [{'id': 'ch_1IjSc5AlCFm536g8aJPBlRvx', 'object': 'charge', 'amount': 1000, 'amount_captured': 1000, 'amount_refunded': 0, 'application': None, 'application_fee': None, 'application_fee_amount': None, 'balance_transaction': 'txn_1IjSc5AlCFm536g8Hn7aOMp3', 'billing_details': {'address': {'city': None, 'country': 'BE', 'line1': None, 'line2': None, 'postal_code': None, 'state': None}, 'email': 'dbo+test@korajac.com', 'name': 'PLOP', 'phone': None}, 'calculated_statement_descriptor': 'ZIRA S.A.', 'captured': True, 'created': 1619198181, 'currency': 'eur', 'customer': 'cus_G27S7FqQ2w3fuH', 'description': 'tx_ref_test_handle_checkout_webhook_wrong_amount', 'destination': None, 'dispute': None, 'disputed': False, 'failure_code': None, 'failure_message': None, 'fraud_details': {}, 'invoice': None, 'livemode': False, 'metadata': {}, 'on_behalf_of': None, 'order': None, 'outcome': {'network_status': 'approved_by_network', 'reason': None, 'risk_level': 'normal', 'risk_score': 32, 'seller_message': 'Payment complete.', 'type': 'authorized'}, 'paid': True, 'payment_intent': 'pi_1IjSc5AlCFm536g8geIfiu2u', 'payment_method': 'pm_1FW3DdAlCFm536g8eQoSCejY', 'payment_method_details': {'card': {'brand': 'visa', 'checks': {'address_line1_check': None, 'address_postal_code_check': None, 'cvc_check': None}, 'country': 'US', 'exp_month': 9, 'exp_year': 2038, 'fingerprint': 'PWV3YLlpVXzInJPm', 'funding': 'credit', 'installments': None, 'last4': '1111', 'network': 'visa', 'three_d_secure': None, 'wallet': None}, 'type': 'card'}, 'receipt_email': None, 'receipt_number': None, 'receipt_url': 'https://pay.stripe.com/receipts/acct_19NebtAlCFm536g8/ch_1IjSc5AlCFm536g8aJPBlRvx/rcpt_JMAyoY0wxSLNJzIS9xgZXhrlGv6SD03', 'refunded': False, 'refunds': {'object': 'list', 'data': [], 'has_more': False, 'total_count': 0, 'url': '/v1/charges/ch_1IjSc5AlCFm536g8aJPBlRvx/refunds'}, 'review': None, 'shipping': None, 'source': None, 'source_transfer': None, 'statement_descriptor': None, 'statement_descriptor_suffix': None, 'status': 'succeeded', 'transfer_data': None, 'transfer_group': None}], 'has_more': False, 'total_count': 1, 'url': '/v1/charges?payment_intent=pi_1IjSc5AlCFm536g8geIfiu2u'}, 'client_secret': 'pi_1IjSc5AlCFm536g8geIfiu2u_secret_Gi682Dw6PXpohs1mbH5kE4xrl', 'confirmation_method': 'automatic', 'created': 1619198181, 'currency': 'eur', 'customer': 'cus_G27S7FqQ2w3fuH', 'description': 'tx_ref_test_handle_checkout_webhook_wrong_amount', 'invoice': None, 'last_payment_error': None, 'livemode': False, 'metadata': {}, 'next_action': None, 'on_behalf_of': None, 'payment_method': 'pm_1FW3DdAlCFm536g8eQoSCejY', 'payment_method_options': {'card': {'installments': None, 'network': None, 'request_three_d_secure': 'automatic'}}, 'payment_method_types': ['card'], 'receipt_email': None, 'review': None, 'setup_future_usage': None, 'shipping': None, 'source': None, 'statement_descriptor': None, 'statement_descriptor_suffix': None, 'status': 'succeeded', 'transfer_data': None, 'transfer_group': None}
