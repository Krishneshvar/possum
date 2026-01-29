-- Audit Log Verification Queries

-- 1. View all audit logs (most recent first)
SELECT 
    al.id,
    al.action,
    al.table_name,
    al.row_id,
    u.name as user_name,
    al.created_at
FROM audit_log al
LEFT JOIN users u ON al.user_id = u.id
ORDER BY al.created_at DESC
LIMIT 50;

-- 2. View login/logout events
SELECT 
    al.id,
    al.action,
    u.name as user_name,
    al.event_details,
    al.created_at
FROM audit_log al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.action IN ('login', 'logout')
ORDER BY al.created_at DESC;

-- 3. View all product changes
SELECT 
    al.id,
    al.action,
    al.row_id as product_id,
    u.name as user_name,
    al.old_data,
    al.new_data,
    al.created_at
FROM audit_log al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.table_name = 'products'
ORDER BY al.created_at DESC;

-- 4. View all customer changes
SELECT 
    al.id,
    al.action,
    al.row_id as customer_id,
    u.name as user_name,
    al.created_at
FROM audit_log al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.table_name = 'customers'
ORDER BY al.created_at DESC;

-- 5. View all sales-related logs
SELECT 
    al.id,
    al.action,
    al.row_id as sale_id,
    u.name as user_name,
    al.new_data,
    al.created_at
FROM audit_log al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.table_name = 'sales'
ORDER BY al.created_at DESC;

-- 6. View audit logs for a specific user
SELECT 
    al.id,
    al.action,
    al.table_name,
    al.row_id,
    al.created_at
FROM audit_log al
WHERE al.user_id = 1  -- Change this to the user ID you want to check
ORDER BY al.created_at DESC;

-- 7. Count actions by type
SELECT 
    action,
    COUNT(*) as count
FROM audit_log
GROUP BY action
ORDER BY count DESC;

-- 8. Count actions by table
SELECT 
    table_name,
    COUNT(*) as count
FROM audit_log
WHERE table_name IS NOT NULL
GROUP BY table_name
ORDER BY count DESC;

-- 9. View recent activity (last 24 hours)
SELECT 
    al.id,
    al.action,
    al.table_name,
    al.row_id,
    u.name as user_name,
    al.created_at
FROM audit_log al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.created_at >= datetime('now', '-1 day')
ORDER BY al.created_at DESC;

-- 10. View detailed log entry with parsed JSON
-- Note: SQLite doesn't have built-in JSON parsing in older versions
-- This query shows the raw JSON data
SELECT 
    al.id,
    al.action,
    al.table_name,
    al.row_id,
    u.name as user_name,
    al.old_data,
    al.new_data,
    al.event_details,
    al.created_at
FROM audit_log al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.id = 1;  -- Change this to the log ID you want to view

-- 11. View all inventory adjustments
SELECT 
    al.id,
    al.action,
    al.row_id,
    u.name as user_name,
    al.new_data,
    al.created_at
FROM audit_log al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.table_name = 'inventory_adjustments'
ORDER BY al.created_at DESC;

-- 12. View all user management actions
SELECT 
    al.id,
    al.action,
    al.row_id as affected_user_id,
    u.name as performed_by,
    al.created_at
FROM audit_log al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.table_name = 'users'
ORDER BY al.created_at DESC;
