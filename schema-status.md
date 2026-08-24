# FFT SHOP Supabase status

Existing core/future tables created during this project include:
- products
- orders
- order_items
- admins
- wallets
- wallet_transactions
- deposit_requests
- shop_settings
- profiles
- wishlists
- product_reviews
- coupons
- coupon_redemptions
- referrals
- notifications
- delivery_tracking
- service_orders
- membership_plans
- memberships
- referral_rewards
- analytics_events
- premium_purchases

Important RPCs:
- adjust_fft_balance
- approve_fft_deposit
- reject_fft_deposit
- fft_create_order_with_payment
- fft_refund_balance_order
- is_fft_admin
- ensure_fft_wallet
- fft_purchase_premium

Privileged RPCs were restricted from PUBLIC/anon. Admin checks must remain enforced inside privileged functions.
