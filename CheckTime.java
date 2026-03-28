import java.time.*;
public class CheckTime {
    public static void main(String[] args) {
        System.out.println("LocalDateTime.now(): " + LocalDateTime.now());
        System.out.println("ZoneId.systemDefault(): " + ZoneId.systemDefault());
        System.out.println("Instant.now(): " + Instant.now());
    }
}
