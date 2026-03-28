package com.possum.shared.util;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

public final class TimeUtil {

    private static final ZoneId UTC = ZoneId.of("UTC");
    private static final ZoneId SYSTEM_ZONE = ZoneId.systemDefault();

    private TimeUtil() {
    }

    /**
     * Get the current time in UTC, suitable for database storage.
     */
    public static LocalDateTime nowUTC() {
        return LocalDateTime.now(UTC);
    }

    /**
     * Convert a database LocalDateTime (assumed UTC) to the system's local timezone.
     */
    public static LocalDateTime toLocal(LocalDateTime utcDateTime) {
        if (utcDateTime == null) {
            return null;
        }
        ZonedDateTime utcZoned = utcDateTime.atZone(UTC);
        return utcZoned.withZoneSameInstant(SYSTEM_ZONE).toLocalDateTime();
    }

    /**
     * Convert a local LocalDateTime to UTC for storage.
     */
    public static LocalDateTime toUTC(LocalDateTime localDateTime) {
        if (localDateTime == null) {
            return null;
        }
        ZonedDateTime localZoned = localDateTime.atZone(SYSTEM_ZONE);
        return localZoned.withZoneSameInstant(UTC).toLocalDateTime();
    }

    /**
     * Use this pattern across the app for human-readable dates.
     */
    public static String format(LocalDateTime dateTime, String pattern) {
        if (dateTime == null) {
            return "";
        }
        return dateTime.format(DateTimeFormatter.ofPattern(pattern));
    }

    /**
     * Standard human-readable format.
     */
    public static String formatStandard(LocalDateTime dateTime) {
        return format(dateTime, "MMM dd, yyyy hh:mm a");
    }
}
