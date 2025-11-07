#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Skrypt inicjalizacji bazy danych dla Saper QR
Tworzy tabele i domyślnego admina jeśli nie istnieją
"""

from app import app, db, Admin

def init_database():
    """Inicjalizuje bazę danych z domyślnymi danymi"""
    with app.app_context():
        print("🗄️  Inicjalizacja bazy danych...")

        # Utwórz wszystkie tabele
        db.create_all()
        print("✓ Tabele utworzone")

        # Sprawdź czy admin istnieje
        admin = Admin.query.first()

        if admin:
            print("✓ Admin już istnieje")
        else:
            # Utwórz domyślnego admina
            admin = Admin(login='admin')
            admin.set_password('admin')
            db.session.add(admin)
            db.session.commit()
            print("✓ Utworzono domyślnego admina")
            print("   Login: admin")
            print("   Hasło: admin")

        print("🎉 Inicjalizacja zakończona!")

if __name__ == '__main__':
    init_database()
