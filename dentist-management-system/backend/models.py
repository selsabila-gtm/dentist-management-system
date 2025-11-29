from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Role(db.Model):
    __tablename__ = "roles"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

    def to_dict(self):
        return {"id": self.id, "name": self.name}


class Staff(db.Model):
    __tablename__ = "staff"

    id = db.Column(db.Integer, primary_key=True)

    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(50))
    address = db.Column(db.String(255))

    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    role_id = db.Column(db.Integer, db.ForeignKey("roles.id"), nullable=False)
    role = db.relationship("Role", backref="staff_members")

    permissions = db.Column(db.JSON, nullable=False, default=dict)

    availability = db.Column(db.String(50))
    days_available = db.Column(db.String(255))
    hours = db.Column(db.String(100))

    # NEW: when the employee was created
    created_at = db.Column(
        db.DateTime, nullable=False, server_default=db.func.now()
    )

    def to_dict(self):
        return {
            "id": self.id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
            "phone": self.phone,
            "address": self.address,
            "username": self.username,
            "role_id": self.role_id,
            "role_name": self.role.name if self.role else None,
            "permissions": self.permissions or {},
            "availability": self.availability,
            "days_available": self.days_available,
            "hours": self.hours,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
