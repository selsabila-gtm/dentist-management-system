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
