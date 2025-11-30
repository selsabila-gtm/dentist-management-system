<<<<<<< HEAD
import sqlite3
from pprint import pprint

conn = sqlite3.connect("instance/dentist.db")
cur = conn.cursor()

print("TABLES:")
cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
pprint(cur.fetchall())

print("\nCOLUMNS IN staff:")
cur.execute("PRAGMA table_info(staff);")
columns = cur.fetchall()
pprint(columns)

print("\nSTAFF ROWS:")
cur.execute("SELECT * FROM staff")
rows = cur.fetchall()
pprint(rows)

conn.close()
=======
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
>>>>>>> a1dd83e2606c2cf848831384c559b1bb3c5b41a7
