# backend/inspect_db.py
import sqlite3
from pprint import pprint

DB_PATH = "instance/dentist.db"


def show_tables():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    print("TABLES:")
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    pprint(cur.fetchall())

    conn.close()


def show_table(name):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    print(f"\nCOLUMNS IN {name}:")
    cur.execute(f"PRAGMA table_info({name});")
    pprint(cur.fetchall())

    print(f"\nROWS IN {name}:")
    cur.execute(f"SELECT * FROM {name};")
    pprint(cur.fetchall())

    conn.close()


if __name__ == "__main__":
    show_tables()
    show_table("staff")
    show_table("patients")
    show_table("medical_records")
    show_table("medical_documents")
