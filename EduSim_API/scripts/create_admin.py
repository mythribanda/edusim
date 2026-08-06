"""
Seed script: create or update an admin user.

Usage
-----
Run from the EduSim_API directory so that app package imports resolve correctly:

    python -m scripts.create_admin --email admin@example.com --password "S3cure!Pass"

Optional flags
--------------
  --name     Display name for the admin account  (default: "Administrator")
  --role     Role to assign                       (default: "admin")
  --force    Overwrite the password if the user already exists
"""

import argparse
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Make sure the EduSim_API root is on sys.path so `app.*` imports work when
# the script is run directly (python scripts/create_admin.py) instead of as a
# module (python -m scripts.create_admin).
# ---------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from sqlalchemy import func  # noqa: E402  (after sys.path fixup)

from app.src.config.database import SessionLocal, engine, Base  # noqa: E402
from app.src.models.user import User  # noqa: E402
from app.src.utils.auth import hash_password  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create or update an admin user in the EduSim database."
    )
    parser.add_argument("--email", required=True, help="Admin e-mail address")
    parser.add_argument("--password", required=True, help="Plain-text password (will be hashed)")
    parser.add_argument("--name", default="Administrator", help="Display name (default: Administrator)")
    parser.add_argument("--role", default="admin", help="Role to assign (default: admin)")
    parser.add_argument(
        "--force",
        action="store_true",
        help="If the user already exists, overwrite their password and role",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    # Basic validation
    email = args.email.strip().lower()
    if not email or "@" not in email:
        sys.exit("ERROR: --email must be a valid e-mail address.")
    if len(args.password) < 8:
        sys.exit("ERROR: --password must be at least 8 characters.")
    if len(args.password.encode("utf-8")) > 72:
        sys.exit("ERROR: --password cannot exceed 72 bytes (bcrypt limit).")

    # Ensure tables exist (safe no-op when they already do)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        existing = db.query(User).filter(func.lower(User.email) == email).first()

        if existing:
            if not args.force:
                print(
                    f"User '{email}' already exists. "
                    "Use --force to overwrite their password and role."
                )
                sys.exit(1)
            # --force: update in place
            existing.password_hash = hash_password(args.password)
            existing.role = args.role
            existing.name = args.name
            existing.is_email_verified = True
            db.commit()
            print(f"[OK] Updated existing user '{email}' (role={args.role}).")
        else:
            admin = User(
                name=args.name,
                email=email,
                password_hash=hash_password(args.password),
                role=args.role,
                is_email_verified=True,
                is_mobile_verified=False,
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print(f"[OK] Created admin user '{email}' with id={admin.id} (role={args.role}).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
