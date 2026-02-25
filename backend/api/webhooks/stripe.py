"""
Stripe Webhook Handler for MiniMe Platform
Processes Stripe webhook events for subscription lifecycle
"""

from fastapi import APIRouter, Request, HTTPException, Header
from fastapi.responses import JSONResponse
import stripe
import os
import json
from datetime import datetime
from typing import Optional

from ...database import get_db
from ...services.stripe_service import StripeService

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])

WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET', '')


def log_billing_event(db, user_id: Optional[int], event_type: str, stripe_event_id: str, event_data: dict):
    """Log billing event to database"""
    cursor = db.cursor()
    cursor.execute(
        """
        INSERT INTO billing_events (user_id, event_type, stripe_event_id, event_data, processed)
        VALUES (%s, %s, %s, %s, FALSE)
        ON CONFLICT (stripe_event_id) DO NOTHING
        """,
        (user_id, event_type, stripe_event_id, json.dumps(event_data))
    )
    db.commit()
    cursor.close()


def get_user_id_from_customer(db, customer_id: str) -> Optional[int]:
    """Get user_id from Stripe customer_id"""
    cursor = db.cursor()
    cursor.execute(
        "SELECT user_id FROM subscriptions WHERE stripe_customer_id = %s",
        (customer_id,)
    )
    result = cursor.fetchone()
    cursor.close()
    return result[0] if result else None


@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature"),
    db=Depends(get_db)
):
    """
    Handle Stripe webhook events
    https://stripe.com/docs/webhooks
    """
    
    payload = await request.body()
    
    # Verify webhook signature
    try:
        event = StripeService.construct_webhook_event(
            payload,
            stripe_signature,
            WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    event_type = event['type']
    event_data = event['data']['object']
    
    print(f"Received webhook: {event_type} - {event['id']}")
    
    cursor = db.cursor()
    
    try:
        # Handle different event types
        if event_type == 'checkout.session.completed':
            # Payment successful, subscription created
            session = event_data
            customer_id = session.get('customer')
            subscription_id = session.get('subscription')
            
            user_id = get_user_id_from_customer(db, customer_id)
            
            if user_id:
                # Update subscription record
                cursor.execute(
                    """
                    UPDATE subscriptions
                    SET stripe_subscription_id = %s, status = 'active'
                    WHERE user_id = %s
                    """,
                    (subscription_id, user_id)
                )
                db.commit()
                
                log_billing_event(db, user_id, event_type, event['id'], event_data)
                print(f"Checkout completed for user {user_id}")
        
        elif event_type == 'customer.subscription.created':
            subscription = event_data
            customer_id = subscription.get('customer')
            user_id = get_user_id_from_customer(db, customer_id)
            
            if user_id:
                # Get plan type from metadata or price
                plan_type = subscription.get('metadata', {}).get('plan_type', 'pro')
                
                cursor.execute(
                    """
                    UPDATE subscriptions
                    SET stripe_subscription_id = %s,
                        status = %s,
                        current_period_start = to_timestamp(%s),
                        current_period_end = to_timestamp(%s),
                        plan_type = %s
                    WHERE user_id = %s
                    """,
                    (
                        subscription['id'],
                        subscription['status'],
                        subscription['current_period_start'],
                        subscription['current_period_end'],
                        plan_type,
                        user_id
                    )
                )
                db.commit()
                
                log_billing_event(db, user_id, event_type, event['id'], event_data)
                print(f"Subscription created for user {user_id}")
        
        elif event_type == 'customer.subscription.updated':
            subscription = event_data
            customer_id = subscription.get('customer')
            user_id = get_user_id_from_customer(db, customer_id)
            
            if user_id:
                cursor.execute(
                    """
                    UPDATE subscriptions
                    SET status = %s,
                        current_period_start = to_timestamp(%s),
                        current_period_end = to_timestamp(%s),
                        cancel_at_period_end = %s
                    WHERE user_id = %s
                    """,
                    (
                        subscription['status'],
                        subscription['current_period_start'],
                        subscription['current_period_end'],
                        subscription.get('cancel_at_period_end', False),
                        user_id
                    )
                )
                db.commit()
                
                log_billing_event(db, user_id, event_type, event['id'], event_data)
                print(f"Subscription updated for user {user_id}")
        
        elif event_type == 'customer.subscription.deleted':
            subscription = event_data
            customer_id = subscription.get('customer')
            user_id = get_user_id_from_customer(db, customer_id)
            
            if user_id:
                # Downgrade to free plan
                cursor.execute(
                    """
                    UPDATE subscriptions
                    SET status = 'canceled',
                        plan_type = 'free',
                        canceled_at = CURRENT_TIMESTAMP,
                        stripe_subscription_id = NULL
                    WHERE user_id = %s
                    """,
                    (user_id,)
                )
                db.commit()
                
                log_billing_event(db, user_id, event_type, event['id'], event_data)
                print(f"Subscription canceled for user {user_id}, downgraded to free")
        
        elif event_type == 'invoice.payment_succeeded':
            invoice = event_data
            customer_id = invoice.get('customer')
            user_id = get_user_id_from_customer(db, customer_id)
            
            if user_id:
                log_billing_event(db, user_id, event_type, event['id'], event_data)
                print(f"Payment succeeded for user {user_id}")
        
        elif event_type == 'invoice.payment_failed':
            invoice = event_data
            customer_id = invoice.get('customer')
            user_id = get_user_id_from_customer(db, customer_id)
            
            if user_id:
                # Mark subscription as past_due
                cursor.execute(
                    "UPDATE subscriptions SET status = 'past_due' WHERE user_id = %s",
                    (user_id,)
                )
                db.commit()
                
                log_billing_event(db, user_id, event_type, event['id'], event_data)
                print(f"Payment failed for user {user_id}")
        
        else:
            print(f"Unhandled event type: {event_type}")
        
        # Mark event as processed
        cursor.execute(
            "UPDATE billing_events SET processed = TRUE WHERE stripe_event_id = %s",
            (event['id'],)
        )
        db.commit()
    
    except Exception as e:
        db.rollback()
        print(f"Error processing webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
    
    return {"status": "success"}


@router.get("/stripe/test")
async def test_webhook():
    """Test endpoint to verify webhook is accessible"""
    return {
        "status": "webhook endpoint active",
        "webhook_secret_configured": bool(WEBHOOK_SECRET),
        "test_mode": StripeService.is_test_mode() if hasattr(StripeService, 'is_test_mode') else True
    }
