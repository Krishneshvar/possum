#!/bin/bash
./gradlew run &
PID=$!
sleep 15
kill $PID
