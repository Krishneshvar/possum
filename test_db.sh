#!/bin/bash
sqlite3 possum.db "SELECT * FROM products LIMIT 1;"
sqlite3 possum.db "SELECT * FROM variants LIMIT 1;"
