package com.possum.persistence.repositories.sqlite;

import com.possum.persistence.db.ConnectionProvider;
import com.possum.persistence.mappers.RowMapper;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

abstract class BaseSqliteRepository {

    private final ConnectionProvider connectionProvider;

    protected BaseSqliteRepository(ConnectionProvider connectionProvider) {
        this.connectionProvider = connectionProvider;
    }

    protected Connection connection() {
        return connectionProvider.getConnection();
    }

    protected <T> Optional<T> queryOne(String sql, RowMapper<T> mapper, Object... params) {
        try (PreparedStatement statement = prepare(sql, params);
             ResultSet rs = statement.executeQuery()) {
            if (!rs.next()) {
                return Optional.empty();
            }
            return Optional.of(mapper.map(rs));
        } catch (SQLException ex) {
            throw new IllegalStateException("Failed queryOne for SQL: " + sql, ex);
        }
    }

    protected <T> List<T> queryList(String sql, RowMapper<T> mapper, Object... params) {
        try (PreparedStatement statement = prepare(sql, params);
             ResultSet rs = statement.executeQuery()) {
            List<T> results = new ArrayList<>();
            while (rs.next()) {
                results.add(mapper.map(rs));
            }
            return results;
        } catch (SQLException ex) {
            throw new IllegalStateException("Failed queryList for SQL: " + sql, ex);
        }
    }

    protected long executeInsert(String sql, Object... params) {
        try (PreparedStatement statement = connection().prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            bind(statement, params);
            statement.executeUpdate();
            try (ResultSet keys = statement.getGeneratedKeys()) {
                if (keys.next()) {
                    return keys.getLong(1);
                }
            }
            return -1L;
        } catch (SQLException ex) {
            throw new IllegalStateException("Failed executeInsert for SQL: " + sql, ex);
        }
    }

    protected int executeUpdate(String sql, Object... params) {
        try (PreparedStatement statement = prepare(sql, params)) {
            return statement.executeUpdate();
        } catch (SQLException ex) {
            throw new IllegalStateException("Failed executeUpdate for SQL: " + sql, ex);
        }
    }

    protected PreparedStatement prepare(String sql, Object... params) throws SQLException {
        PreparedStatement statement = connection().prepareStatement(sql);
        bind(statement, params);
        return statement;
    }

    protected static void bind(PreparedStatement statement, Object... params) throws SQLException {
        for (int i = 0; i < params.length; i++) {
            statement.setObject(i + 1, params[i]);
        }
    }
}
