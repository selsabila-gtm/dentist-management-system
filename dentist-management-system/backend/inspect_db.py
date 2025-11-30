# backend/inspect_db.py
import sqlite3

DB_PATH = "instance/dentist.db"


def show_tables():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    print("Tables:")
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    for row in cur.fetchall():
        print("-", row[0])

    conn.close()


def show_table(name):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    print(f"\nSchema for {name}:")
    cur.execute(f"PRAGMA table_info({name});")
    for row in cur.fetchall():
        print(row)

    print(f"\nRows in {name}:")
    cur.execute(f"SELECT * FROM {name};")
    for row in cur.fetchall():
        print(row)

    conn.close()


if __name__ == "__main__":
    show_tables()
    show_table("patients")
    show_table("medical_records")
    show_table("medical_documents")
