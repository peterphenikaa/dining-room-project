-- Chạy 1 lần khi nâng cấp từ monolith (sau migration:run:auth, trước DropAuthTables dining).
-- Copy users + identities từ dining DB sang auth DB.

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE phongan_auth.auth_identities;
TRUNCATE TABLE phongan_auth.users;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO phongan_auth.users SELECT * FROM phongan_db.users;
INSERT INTO phongan_auth.auth_identities SELECT * FROM phongan_db.auth_identities;
