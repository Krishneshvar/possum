package com.possum.shared.util;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;

public final class SqlMapperUtils {

    private SqlMapperUtils() {
    }

    public static BigDecimal getBigDecimal(ResultSet rs, String column) throws SQLException {
        Object raw = rs.getObject(column);
        if (raw == null) {
            return null;
        }
        if (raw instanceof BigDecimal value) {
            return value;
        }
        return new BigDecimal(raw.toString());
    }

    public static Boolean getBooleanFromInt(ResultSet rs, String column) throws SQLException {
        int value = rs.getInt(column);
        if (rs.wasNull()) {
            return null;
        }
        return value == 1;
    }

    public static LocalDateTime getLocalDateTime(ResultSet rs, String column) throws SQLException {
        Timestamp timestamp = rs.getTimestamp(column);
        if (timestamp != null) {
            return timestamp.toLocalDateTime();
        }
        String text = rs.getString(column);
        if (text == null || text.isBlank()) {
            return null;
        }
        text = text.replace(' ', 'T');
        return LocalDateTime.parse(text);
    }

    public static LocalDate getLocalDate(ResultSet rs, String column) throws SQLException {
        String text = rs.getString(column);
        if (text == null || text.isBlank()) {
            return null;
        }
        return LocalDate.parse(text);
    }
}
