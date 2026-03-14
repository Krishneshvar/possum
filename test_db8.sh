#!/bin/bash
java -cp "build/classes/java/main:$(find ~/.gradle/caches/modules-2/files-2.1/ -name "sqlite-jdbc-*.jar" | head -n 1)" \
  -Djava.library.path=. \
  TestApp
