#!/bin/bash
sqlite3 "$HOME/.possum/possum.db" "SELECT * FROM products LIMIT 1;" || echo "No POSSUM DB in HOME"
