package com.possum.persistence.db;

import com.possum.infrastructure.filesystem.AppPaths;
import org.flywaydb.core.Flyway;
import org.sqlite.SQLiteConfig;

import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Objects;

public final class DatabaseManager implements ConnectionProvider, AutoCloseable {

    private final AppPaths appPaths;
    private Connection connection;

    public DatabaseManager(AppPaths appPaths) {
        this.appPaths = Objects.requireNonNull(appPaths, "appPaths must not be null");
    }

    public synchronized void initialize() {
        if (isConnectionOpen()) {
            return;
        }

        Path databasePath = appPaths.getDatabasePath().toAbsolutePath();
        String jdbcUrl = "jdbc:sqlite:" + databasePath;

        runMigrations(jdbcUrl);

        SQLiteConfig config = new SQLiteConfig();
        config.enforceForeignKeys(true);
        config.setBusyTimeout(5_000);

        Connection candidate = null;

        try {
            candidate = DriverManager.getConnection(jdbcUrl, config.toProperties());
            candidate.setAutoCommit(true);
            try (Statement statement = candidate.createStatement()) {
                statement.execute("PRAGMA foreign_keys = ON");
                statement.execute("PRAGMA journal_mode = WAL");
            }
            connection = candidate;
        } catch (SQLException ex) {
            closeQuietly(candidate);
            throw new IllegalStateException("Failed to initialize database connection", ex);
        }
    }

    private static void runMigrations(String jdbcUrl) {
        Flyway flyway = Flyway.configure()
                .dataSource(jdbcUrl, null, null)
                .locations("classpath:sql/migrations")
                .validateMigrationNaming(true)
                .load();
        flyway.migrate();
    }

    @Override
    public synchronized Connection getConnection() {
        if (!isConnectionOpen()) {
            initialize();
        }
        return connection;
    }

    @Override
    public synchronized void close() {
        if (!isConnectionOpen()) {
            return;
        }

        try {
            connection.close();
        } catch (SQLException ex) {
            throw new IllegalStateException("Failed to close database connection", ex);
        } finally {
            connection = null;
        }
    }

    private boolean isConnectionOpen() {
        if (connection == null) {
            return false;
        }

        try {
            return !connection.isClosed();
        } catch (SQLException ex) {
            throw new IllegalStateException("Unable to evaluate database connection state", ex);
        }
    }

    private static void closeQuietly(Connection candidate) {
        if (candidate == null) {
            return;
        }
        try {
            candidate.close();
        } catch (SQLException ignored) {
            // Best effort cleanup during failed initialization.
        }
    }
}
