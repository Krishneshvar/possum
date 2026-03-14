#!/bin/bash
sqlite3 "$HOME/.local/share/possum/database/possum.db" "SELECT * FROM products LIMIT 1;" || echo "No POSSUM DB"
