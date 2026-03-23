"""
scripts/seed_db.py
───────────────────
Development seed script — populates the database with realistic demo data.

Creates:
  - 2 demo user accounts
  - 20 ride comparisons with surge events
  - Enough surge history to train the ML model

Usage:
    python scripts/seed_db.py
"""
from __future__ import annotations

import asyncio
import random
import sys
import os
from datetime import datetime, timedelta, timezone

# Make the app importable from the project root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models.ride import RideComparison, RideOption
from app.models.surge import SurgeEvent
from app.models.user import User

# ── Demo data ─────────────────────────────────────────────────────────────────

DEMO_USERS = [
    {
        "email": "christabel@ridesync.gh",
        "full_name": "Christabel Araba Edumadze",
        "password": "Demo1234!",
        "preferred_sort": "cost",
    },
    {
        "email": "demo@ridesync.gh",
        "full_name": "Demo User",
        "password": "Demo1234!",
        "preferred_sort": "time",
    },
]

# Accra landmark GPS coordinates
ACCRA_LOCATIONS = [
    ("Kotoka International Airport, Accra",           5.6052, -0.1668),
    ("Accra Mall, Spintex Road, Accra",               5.6360, -0.1632),
    ("University of Ghana, Legon, Accra",             5.6502, -0.1864),
    ("Kwame Nkrumah Memorial Park, Accra",            5.5500, -0.2010),
    ("Osu Oxford Street, Accra",                      5.5560, -0.1870),
    ("East Legon, Accra",                             5.6427, -0.1527),
    ("Cantonments, Accra",                            5.5673, -0.1750),
    ("Tema Station, Accra",                           5.5530, -0.2060),
    ("Madina Market, Accra",                          5.6800, -0.1650),
    ("Achimota, Accra",                               5.6145, -0.2291),
]

PLATFORMS = ["uber", "bolt", "yango"]

UBER_CATEGORIES  = ["UberX", "Uber Comfort", "Uber XL"]
BOLT_CATEGORIES  = ["Bolt", "Bolt Comfort", "Bolt XL"]
YANGO_CATEGORIES = ["Yango", "Yango Plus"]

CATEGORY_MAP = {
    "uber":  UBER_CATEGORIES,
    "bolt":  BOLT_CATEGORIES,
    "yango": YANGO_CATEGORIES,
}


def random_fare(distance_km: float, platform: str) -> dict:
    base_rates = {"uber": 3.50, "bolt": 3.00, "yango": 2.80}
    base = base_rates[platform]
    time_mult = random.uniform(0.9, 1.8)
    estimate = round((base * distance_km + 1.5) * time_mult, 2)
    return {
        "fare_estimate_ghs": estimate,
        "fare_min_ghs": round(estimate * 0.90, 2),
        "fare_max_ghs": round(estimate * 1.12, 2),
        "is_surge": time_mult >= 1.3,
        "surge_multiplier": round(time_mult, 2),
    }


async def seed(db: AsyncSession) -> None:
    print("🌱 Seeding RideSync+ database...")

    # ── Users ─────────────────────────────────────────────────────────────────
    created_users = []
    for user_data in DEMO_USERS:
        user = User(
            email=user_data["email"],
            full_name=user_data["full_name"],
            hashed_password=hash_password(user_data["password"]),
            preferred_sort=user_data["preferred_sort"],
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        created_users.append(user)

    await db.flush()
    print(f"  ✅ Created {len(created_users)} demo users")

    # ── Ride comparisons ──────────────────────────────────────────────────────
    comparison_count = 0
    for i in range(30):
        origin = random.choice(ACCRA_LOCATIONS)
        destination = random.choice([loc for loc in ACCRA_LOCATIONS if loc != origin])

        # Distribute over the past 30 days
        days_ago = random.randint(0, 30)
        hours_ago = random.randint(0, 23)
        created = datetime.now(timezone.utc) - timedelta(days=days_ago, hours=hours_ago)

        import math
        distance_km = math.sqrt(
            (origin[1] - destination[1]) ** 2 + (origin[2] - destination[2]) ** 2
        ) * 111  # rough km per degree

        any_surge = False
        options = []

        for platform in PLATFORMS:
            categories = CATEGORY_MAP[platform]
            for category in categories:
                fare_data = random_fare(distance_km, platform)
                if fare_data["is_surge"]:
                    any_surge = True

                deep_links = {
                    "uber":  f"uber://?action=setPickup&pickup[latitude]={origin[1]}&dropoff[latitude]={destination[1]}",
                    "bolt":  f"bolt://ride?pickup_lat={origin[1]}&destination_lat={destination[1]}",
                    "yango": f"yango://order?startLat={origin[1]}&endLat={destination[1]}",
                }

                options.append({
                    "platform": platform,
                    "ride_category": category,
                    "eta_minutes": random.randint(2, 15),
                    "driver_rating": round(random.uniform(4.0, 4.9), 1),
                    "drivers_nearby": random.randint(1, 10),
                    "deep_link_url": deep_links[platform],
                    **fare_data,
                })

        user = random.choice(created_users)
        comparison = RideComparison(
            user_id=user.id,
            origin_address=origin[0],
            origin_lat=origin[1],
            origin_lng=origin[2],
            destination_address=destination[0],
            destination_lat=destination[1],
            destination_lng=destination[2],
            is_surge_detected=any_surge,
            created_at=created,
        )
        db.add(comparison)
        await db.flush()

        for opt_data in options:
            db.add(RideOption(comparison_id=comparison.id, **opt_data))

        comparison_count += 1

    await db.flush()
    print(f"  ✅ Created {comparison_count} ride comparisons")

    # ── Surge events (for ML training) ────────────────────────────────────────
    surge_count = 0
    for _ in range(200):
        hour = random.randint(0, 23)
        day  = random.randint(0, 6)
        # Bias towards realistic surge hours
        if random.random() < 0.4:
            hour = random.choice([7, 8, 9, 17, 18, 19, 20])
        mult = random.uniform(1.1, 2.2) if hour in {7, 8, 17, 18, 19} else random.uniform(0.9, 1.5)
        db.add(SurgeEvent(
            platform=random.choice(PLATFORMS),
            hour_of_day=hour,
            day_of_week=day,
            surge_multiplier=round(mult, 2),
            is_weekend=day >= 5,
        ))
        surge_count += 1

    await db.flush()
    print(f"  ✅ Created {surge_count} surge events for ML training")

    print("\n🎉 Seed complete!")
    print("\nDemo credentials:")
    for u in DEMO_USERS:
        print(f"   📧 {u['email']}  🔑 {u['password']}")


async def main():
    async with AsyncSessionLocal() as db:
        await seed(db)
        await db.commit()


if __name__ == "__main__":
    asyncio.run(main())
