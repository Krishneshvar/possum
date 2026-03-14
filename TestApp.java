import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class TestApp {
    public static void main(String[] args) {
        try {
            Class.forName("org.sqlite.JDBC");
            Connection conn = DriverManager.getConnection("jdbc:sqlite::memory:");
            Statement stmt = conn.createStatement();
            stmt.execute("CREATE TABLE variants (id INTEGER PRIMARY KEY, product_id INTEGER, name TEXT, is_default INTEGER, mrp REAL, cost_price REAL, stock_alert_cap INTEGER, status TEXT, deleted_at TEXT)");
            stmt.execute("INSERT INTO variants (id, product_id, name, is_default, mrp, cost_price, stock_alert_cap, status) VALUES (1, 1, 'Var1', 1, 10.0, 5.0, 10, 'active')");

            ResultSet rs = stmt.executeQuery("SELECT v.id, v.product_id, 'P1' AS product_name, v.name, 'SKU' AS sku, v.mrp AS price, v.cost_price, v.stock_alert_cap, v.is_default, v.status, 'path' AS image_path, 0 AS stock, CURRENT_TIMESTAMP AS created_at, CURRENT_TIMESTAMP AS updated_at, NULL AS deleted_at FROM variants v");

            com.possum.persistence.mappers.VariantMapper mapper = new com.possum.persistence.mappers.VariantMapper();
            if (rs.next()) {
                com.possum.domain.model.Variant v = mapper.map(rs);
                System.out.println("Mapped variant: " + v);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
