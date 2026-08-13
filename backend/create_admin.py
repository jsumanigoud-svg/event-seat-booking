from app.database import SessionLocal
from app.models import Admin
from app.auth import pwd_context


db = SessionLocal()

try:
    admin = (
        db.query(Admin)
        .filter(
            Admin.username == "admin"
        )
        .first()
    )

    hashed_password = pwd_context.hash(
        "admin123"
    )

    if admin:
        # Reset existing admin password
        admin.password_hash = hashed_password

        print(
            "Admin password reset successfully."
        )

    else:
        # Create new admin
        admin = Admin(
            username="admin",
            password_hash=hashed_password
        )

        db.add(admin)

        print(
            "Admin user created successfully."
        )

    db.commit()

finally:
    db.close()