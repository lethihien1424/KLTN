-- Repair existing databases created without the permission group ID default.
-- Run against the existing database; do not reinitialize its data volume.
BEGIN;
LOCK TABLE nhom_quyen IN ACCESS EXCLUSIVE MODE;
CREATE SEQUENCE IF NOT EXISTS nhom_quyen_seq START 1;
SELECT setval(
    'nhom_quyen_seq',
    GREATEST(
        (SELECT last_value FROM nhom_quyen_seq),
        COALESCE((SELECT MAX(SUBSTRING(ma FROM 2)::bigint)
                  FROM nhom_quyen WHERE ma ~ '^Q[0-9]+$'), 0) + 1
    ),
    false
);
ALTER TABLE nhom_quyen ALTER COLUMN ma SET DEFAULT (
    'Q' || LPAD(nextval('nhom_quyen_seq')::text, 4, '0')
);
COMMIT;
